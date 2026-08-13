In Development (npm run electron:dev): app.isPackaged is false, so it connects to your local dev server at http://localhost:8080.
In Production / Packaged App (npm run electron:build): app.isPackaged is true, so Electron automatically loads and fetches directly from https://streamflix.dpdns.org/.
Override Anytime: You can also force any URL at runtime via environment variable:
ELECTRON_START_URL=https://streamflix.dpdns.org/ npx electron .