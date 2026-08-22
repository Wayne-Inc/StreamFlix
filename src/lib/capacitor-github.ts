import { registerPlugin } from "@capacitor/core";
import { GithubAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

const FirebaseAuthentication = registerPlugin("FirebaseAuthentication");

export async function signInWithGitHubNative() {
  const result = await FirebaseAuthentication.signInWithGithub();
  if (result.credential) {
    const credential = GithubAuthProvider.credential(result.credential.idToken);
    await signInWithCredential(auth, credential);
    return true;
  }
  return false;
}
