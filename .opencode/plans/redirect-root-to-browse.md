# Plan: Redirect logged-in users from root to /browse

## Goal
When a user goes to the root page (/), confirm whether they are logged in and redirect them directly to /browse. Remove dependency on profile selection for the root redirect.

## Current behavior (in src/routes/index.tsx)
- If localStorage.getItem("sf:auth") === "1", checks getSelectedProfile():
  - If profile selected ? redirect to /browse
  - If no profile ? redirect to /profiles
- If not cached, checks Firebase auth state; same logic
- If not logged in, shows landing page

## Proposed change
In src/routes/index.tsx eforeLoad, when user is confirmed logged in (via cache or Firebase), always redirect to /browse regardless of profile selection. Remove usage of getSelectedProfile() from the redirect logic.

## Files to modify
- src/routes/index.tsx - update eforeLoad to redirect to /browse for logged-in users

## Notes
- Browse page may need a profile in some flows, but the requirement is just to redirect logged-in users to /browse from root.
- Need to keep the redirect exception handling intact.
- Remove getSelectedProfile import if no longer used? The import might still be needed elsewhere? Let us check - it's imported but only used in beforeLoad. Can remove it to keep code clean.
