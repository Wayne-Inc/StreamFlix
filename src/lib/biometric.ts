export type BiometricCredential = {
  credentialId: string;
  publicKey: string;
};

const rpName = "StreamFlix";

function getRpId(): string {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname || "localhost";
}

function bufToB64u(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64uToBuf(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function getBiometricLabel(): string {
  if (typeof navigator === "undefined") return "Biometric";
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return "Windows Hello";
  if (/iphone|ipad|ipod/i.test(ua)) return "Face ID";
  if (/macintosh|mac os/i.test(ua)) return "Touch ID / Face ID";
  if (/android/i.test(ua)) return "Fingerprint / Face unlock";
  return "Biometric";
}

export async function registerBiometric(displayName: string): Promise<BiometricCredential> {
  if (!(await isBiometricAvailable())) {
    throw new Error(`${getBiometricLabel()} is not available on this device`);
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const baseOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: rpName, id: getRpId() },
    user: { name: displayName, displayName, id: userId },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    timeout: 60000,
    attestation: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  };
  const platformOptions: PublicKeyCredentialCreationOptions = {
    ...baseOptions,
    authenticatorSelection: {
      ...baseOptions.authenticatorSelection,
      authenticatorAttachment: "platform",
    },
  };

  let credential: PublicKeyCredential | null = null;
  try {
    credential = (await navigator.credentials.create({
      publicKey: platformOptions,
    })) as PublicKeyCredential | null;
  } catch {
    credential = (await navigator.credentials.create({
      publicKey: baseOptions,
    })) as PublicKeyCredential | null;
  }
  if (!credential) throw new Error("Biometric setup was cancelled");

  const response = credential.response as AuthenticatorAttestationResponse;
  const getPublicKey = (response as unknown as {
    getPublicKey?: () => ArrayBuffer | null;
  }).getPublicKey?.bind(response);
  let publicKey: ArrayBuffer | null = null;
  if (typeof getPublicKey === "function") {
    publicKey = getPublicKey();
  }
  if (!publicKey) {
    throw new Error("This browser can't store the biometric key — use a PIN instead");
  }

  return {
    credentialId: bufToB64u(credential.rawId),
    publicKey: bufToB64u(publicKey),
  };
}

export async function verifyBiometric(credential: BiometricCredential): Promise<boolean> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const options: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: getRpId(),
    allowCredentials: [{ type: "public-key", id: b64uToBuf(credential.credentialId) }],
    userVerification: "required",
    timeout: 60000,
  };
  const assertion = (await navigator.credentials.get({ publicKey: options })) as
    | PublicKeyCredential
    | null;
  if (!assertion) return false;

  const response = assertion.response as AuthenticatorAssertionResponse;
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      b64uToBuf(credential.publicKey),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const clientDataHash = await crypto.subtle.digest("SHA-256", response.clientDataJSON);
    const signedData = new Uint8Array(
      response.authenticatorData.byteLength + clientDataHash.byteLength,
    );
    signedData.set(new Uint8Array(response.authenticatorData), 0);
    signedData.set(new Uint8Array(clientDataHash), response.authenticatorData.byteLength);
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      response.signature,
      signedData,
    );
  } catch {
    return false;
  }
}
