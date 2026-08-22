import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { GithubAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signInWithGitHubNative() {
  const result = await FirebaseAuthentication.signInWithGithub();
  if (result.credential) {
    const credential = GithubAuthProvider.credential(result.credential.idToken);
    await signInWithCredential(auth, credential);
    return true;
  }
  return false;
}
