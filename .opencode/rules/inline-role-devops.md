# Execute devops/infrastructure work inline (no subagent)

The main agent performs ALL devops/infrastructure work itself. Multi-agent spawning is DISABLED in this project — the active model does not support spawning subagents. Do NOT call the task tool to spawn specialist subagents. Apply this role inline.

## Trigger

Apply this role when a task involves ANY of:
- CI/CD pipeline setup (GitHub Actions, EAS Build, or equivalent)
- Supabase project setup (local CLI `supabase start` or hosted project configuration)
- EAS build configuration (app.json, eas.json, build profiles for dev/preview/prod)
- Environment variable and secret management (EAS env, .env schema)
- Deployment strategy: dev → preview → production promotion
- App store / Play Store distribution config
- Infrastructure as code for Supabase or any cloud resources
- Monorepo tooling setup (npm/yarn/pnpm workspaces, turborepo)

## Domain knowledge

- EAS Build profiles: development (dev client), preview (internal testing), production (store submission). Configure eas.json with correct channel, env variables, and credentials.
- Supabase setup: local development via `supabase start` (Docker-based, includes Postgres, Edge Functions, Auth, Realtime), versus hosted project with `supabase link`. Migrations via `supabase migration`.
- CI/CD: GitHub Actions for lint + typecheck + test (PR gate), then EAS Build on main merge for Android APK/AAB and iOS IPA.
- Environment management: EAS secrets for production keys (Supabase URL, anon key, service role key, Google OAuth client ID). Never commit secrets.
- Monorepo: npm/yarn workspaces with `apps/` and `packages/` structure. `apps/client` (Expo), `apps/dal` (backend), `packages/*` (shared schemas, types, utils).
- Deployment: Supabase Edge Functions via `supabase functions deploy`, RPC via migration files, schema changes via migrations.
- Versioning and changelog: semantic versioning, auto-changelog generation from conventional commits.

## Key documents

- `app.json`, `eas.json`, `tsconfig.json` — project root config files
- `.env` schema — environment variable documentation
- FSD §7.3 (ADR), deployment model once decided
- BRD NFR-MNT-05 (portability), NFR-DEP-01..03 (deployment)

## Boundaries

- NEVER modify application code — only infrastructure, build, CI/CD, and config files.
- NEVER commit secrets or keys to the repository (NFR-SEC-05).
- Do not make architectural decisions that belong to `inline-role-system-analyst` — consult that role for deployment model decisions.
- When touching `opencode.json` or opencode config files, apply `customize-opencode` guidelines.

## Output

- CI/CD pipeline files (.github/workflows, .eas/build).
- Configuration files (eas.json, app.json, .env schema).
- Setup scripts or documentation for local development environment.
- Deployment runbook: steps/commands for promote from dev→preview→production.
- When reviewing infra: flag security risks (exposed keys, missing branch protection, weak deployment gates).