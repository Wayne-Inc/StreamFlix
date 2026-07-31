import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google", opts?: { redirect_uri?: string }) => {
      try {
        const googleProvider = new GoogleAuthProvider();
        if (opts?.redirect_uri) {
          googleProvider.setCustomParameters({ redirect_uri: opts.redirect_uri });
        }
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, redirected: false, error: null };
      } catch (error: any) {
        if (error.code === "auth/popup-closed-by-user") {
          return { user: null, redirected: false, error: null };
        }
        if (error.code === "auth/popup-blocked") {
          return {
            user: null,
            redirected: false,
            error: new Error("Popup was blocked. Please allow popups for this site and try again."),
          };
        }
        return { user: null, redirected: false, error };
      }
    },
  },
};
