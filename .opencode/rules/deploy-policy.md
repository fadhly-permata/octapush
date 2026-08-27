# Deployment Policy — Web only, DEV environment, Expo.dev

## Scope

This policy governs ALL deployment actions for the OctaPush project.
It applies to every team member, CI pipeline, and manual CLI invocation.

## Rules

### 1. Allowed deployments

- **Platform:** Web only (static SPA export via `expo export --platform web`).
- **Environment:** DEV (preview) only — use `eas deploy` without `--prod`.
- **Hosting:** Expo.dev (EAS Hosting) only, via `eas deploy --non-interactive --dev-domain <name>`.

### 2. Forbidden deployments

| Action | Reason |
|---|---|
| `eas deploy --prod` | PROD promotion requires explicit authorization from the project owner. |
| `eas build -p android` / `eas build -p ios` | Mobile builds are blocked by Free plan quota and are not part of the current deployment scope. |
| Deploying to any host other than Expo.dev (Netlify, Vercel, GitHub Pages, etc.) | Centralized deployment tracking via EAS only. Web export static files may be hosted elsewhere only with explicit approval. |
| `expo start` exposed to public internet | Dev server is for local development only. |

### 3. Exceptions

- **Local development:** `expo start` (web, Android, iOS) for local-only testing is unrestricted.
- **Web export:** `expo export --platform web` for local artifact inspection is unrestricted.
- These rules may be amended by updating this file and committing via PR.

## Enforcement

- CI/CD pipeline must NOT contain `--prod` or `-p android` / `-p ios` flags.
- Manual deploys: verify with `git log` that the latest commit is on `feat/*` or `main` (but never `--prod` without owner approval).
- Violations are recorded as security events in the project audit log.