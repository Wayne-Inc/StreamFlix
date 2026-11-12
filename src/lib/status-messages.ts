/**
 * Copy shown while an auth action is in flight.
 *
 * The first entry is the honest, expected status; later entries keep the person
 * company when the request takes longer than usual (cold starts, slow networks,
 * Firebase hiccups) without pretending the app has finished.
 */

export const SIGN_IN_MESSAGES = [
  "Signing you in…",
  "Checking your details…",
  "Verifying your session…",
  "Almost there…",
  "Hang tight, still working…",
] as const;

export const SIGN_UP_MESSAGES = [
  "Creating your account…",
  "Setting up your profile…",
  "Saving your details…",
  "Almost there…",
  "Hang tight, still working…",
] as const;

export const PASSWORD_RESET_MESSAGES = [
  "Sending the reset link…",
  "Reaching the mail server…",
  "Almost there…",
] as const;

export const GOOGLE_SIGN_IN_MESSAGES = [
  "Opening Google…",
  "Waiting for Google…",
  "Finishing sign-in…",
  "Almost there…",
] as const;

export const GITHUB_SIGN_IN_MESSAGES = [
  "Opening GitHub…",
  "Waiting for GitHub…",
  "Finishing sign-in…",
  "Almost there…",
] as const;

export const LINK_ACCOUNT_MESSAGES = [
  "Linking your account…",
  "Securing your sign-in…",
  "Almost there…",
] as const;

export const SIGN_OUT_MESSAGES = [
  "Signing you out…",
  "Clearing your session…",
  "Removing this device…",
  "See you soon…",
] as const;
