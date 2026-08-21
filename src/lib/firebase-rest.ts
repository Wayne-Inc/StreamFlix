import { importPKCS8, SignJWT } from "jose";

const SCOPES = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging";

let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires > now + 60_000) return cachedToken.token;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");

  const key = await importPKCS8(privateKey, "RS256");
  const iat = Math.floor(now / 1000);
  const jwt = await new SignJWT({
    iss: clientEmail,
    scope: SCOPES,
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp: iat + 3600,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expires: now + data.expires_in * 1000 };
  return cachedToken.token;
}

function firestoreUrl(projectId: string, collection?: string, docId?: string): string {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  if (docId) return `${base}/${collection}/${docId}`;
  if (collection) return `${base}/${collection}`;
  return base;
}

type FirestoreDoc = { name: string; fields: Record<string, unknown>; createTime: string; updateTime: string };

function parseFirestoreValue(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue as { values?: Record<string, unknown>[] }).values?.map(parseFirestoreValue) ?? [];
  if ("mapValue" in v) return parseFirestoreFields((v.mapValue as { fields?: Record<string, unknown> }).fields ?? {});
  return v;
}

function parseFirestoreFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = parseFirestoreValue(v as Record<string, unknown>);
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
            value: filters[0].value === null ? { nullValue: null } : { stringValue: filters[0].value },
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
  const rows = (await res.json()) as Array<{ document?: FirestoreDoc; error?: { message: string } }>;
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
    else if (typeof v === "number") body[k] = Number.isInteger(v) ? { integerValue: v } : { doubleValue: v };
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
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
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
      },
    );
    if (res.ok) successCount++;
    else failureCount++;
  }

  return { successCount, failureCount };
}
