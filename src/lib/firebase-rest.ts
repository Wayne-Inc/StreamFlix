const SCOPES =
  "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWT_AUDIENCE = "https://oauth2.googleapis.com/token";

type CachedToken = { token: string; expires: number };

let cachedToken: CachedToken | undefined;
let cachedPrivateKey: CryptoKey | undefined;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkcs8PemToCryptoKey(pem: string): Promise<CryptoKey> {
  if (!pem.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is not a PKCS#8 PEM key (expected a '-----BEGIN PRIVATE KEY-----' block).",
    );
  }
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function getPrivateKey(pem: string): Promise<CryptoKey> {
  if (!cachedPrivateKey) cachedPrivateKey = await pkcs8PemToCryptoKey(pem);
  return cachedPrivateKey;
}

async function signRs256(payload: Record<string, unknown>, pem: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${header}.${body}`;
  const key = await getPrivateKey(pem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires > now + 60_000) return cachedToken.token;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
  }

  const iat = Math.floor(now / 1000);
  const jwt = await signRs256(
    {
      iss: clientEmail,
      sub: clientEmail,
      scope: SCOPES,
      aud: JWT_AUDIENCE,
      iat,
      exp: iat + 3600,
    },
    privateKey,
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  if (!data?.access_token) {
    throw new Error("Token exchange returned no access_token.");
  }
  cachedToken = { token: data.access_token, expires: now + data.expires_in * 1000 };
  return cachedToken.token;
}

function firestoreUrl(projectId: string, collection?: string, docId?: string): string {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  if (docId) return `${base}/${collection}/${docId}`;
  if (collection) return `${base}/${collection}`;
  return base;
}

type FirestoreDoc = {
  name: string;
  fields: Record<string, unknown>;
  createTime: string;
  updateTime: string;
};

function parseFirestoreValue(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v)
    return (
      (v.arrayValue as { values?: Record<string, unknown>[] }).values?.map(parseFirestoreValue) ??
      []
    );
  if ("mapValue" in v)
    return parseFirestoreFields((v.mapValue as { fields?: Record<string, unknown> }).fields ?? {});
  return v;
}

function parseFirestoreFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields))
    out[k] = parseFirestoreValue(v as Record<string, unknown>);
  return out;
}

export async function runFirestoreQuery(
  projectId: string,
  collection: string,
  filters: Array<{ field: string; op: "EQUAL" | "NOT_EQUAL"; value: string | null }>,
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const token = await getAccessToken();
  const url = `${firestoreUrl(projectId)}:runQuery`;
  const where =
    filters.length === 1
      ? {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: "EQUAL",
            value:
              filters[0].value === null ? { nullValue: null } : { stringValue: filters[0].value },
          },
        }
      : {
          compositeFilter: {
            op: "AND",
            filters: filters.map((f) => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: "EQUAL",
                value: f.value === null ? { nullValue: null } : { stringValue: f.value },
              },
            })),
          },
        };

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: collection }], where } }),
  });
  if (!res.ok) throw new Error(`Firestore query failed: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as Array<{
    document?: FirestoreDoc;
    error?: { message: string };
  }>;
  return rows
    .filter((r) => r.document)
    .map((r) => {
      const doc = r.document!;
      const id = doc.name.split("/").pop()!;
      return { id, data: parseFirestoreFields(doc.fields ?? {}) };
    });
}

export async function updateFirestoreDoc(
  projectId: string,
  collection: string,
  docId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const token = await getAccessToken();
  const url = `${firestoreUrl(projectId, collection, docId)}?updateMask.fieldPaths=${Object.keys(fields).join(",")}`;
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) body[k] = { nullValue: null };
    else if (typeof v === "string") body[k] = { stringValue: v };
    else if (typeof v === "number")
      body[k] = Number.isInteger(v) ? { integerValue: v } : { doubleValue: v };
    else if (typeof v === "boolean") body[k] = { booleanValue: v };
    else if (v instanceof Date) body[k] = { timestampValue: v.toISOString() };
    else body[k] = { stringValue: JSON.stringify(v) };
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: body }),
  });
  if (!res.ok) throw new Error(`Firestore update failed: ${res.status} ${await res.text()}`);
}

export async function sendFcmMulticast(
  projectId: string,
  tokens: string[],
  notification: { title: string; body: string },
  data: Record<string, string>,
): Promise<{ successCount: number; failureCount: number }> {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };
  const token = await getAccessToken();
  let successCount = 0;
  let failureCount = 0;

  for (const t of tokens) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: t,
          notification,
          data,
          webpush: {
            fcmOptions: { link: data.url || "/" },
            notification: { icon: "/icon.png", badge: "/icon.png" },
          },
        },
      }),
    });
    if (res.ok) successCount++;
    else failureCount++;
  }

  return { successCount, failureCount };
}
