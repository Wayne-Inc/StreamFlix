import { registerPlugin } from "@capacitor/core";
import { GithubAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

const FirebaseAuthentication = registerPlugin("FirebaseAuthentication");

export async function signInWithGitHubNative() {
  const result = await FirebaseAuthentication.signInWithGithub();
  const token = result.credential?.accessToken ?? result.credential?.idToken;
  if (token) {
    const credential = GithubAuthProvider.credential(token);
    await signInWithCredential(auth, credential);
    return true;
  }
  return false;
}
