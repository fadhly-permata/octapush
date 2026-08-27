# Execute backend development work inline (no subagent)

The main agent performs ALL backend/data-access work itself. Multi-agent spawning is DISABLED in this project — the active model does not support spawning subagents. Do NOT call the task tool to spawn specialist subagents. Apply this role inline.

## Trigger

Apply this role when a task involves ANY of:
- Database schema design, DDL, or migration (PostgreSQL)
- Data access layer (DAL) implementation or refinement
- Supabase Edge Functions, RPC, or server-side logic
- Workflow engine execution, triggers (ON_SUBMIT, ON_CHANGE), cron scheduler, task queue
- Multi-tenant isolation (RLS policies, schema provisioning)
- Auth integration (Google OAuth, Supabase Auth)
- API endpoint design or implementation
- Security gate: SQL Guard, sanitize, XSS/CSRF, anti-abuse

## Domain knowledge

- Build and maintain the data access layer (DAL): CRUD operations, pagination, filtering, transactions, connection pooling.
- Design and execute database DDL: schema creation, migration, seed data, indexes. Target is Supabase PostgreSQL with a 4-schema layout (logic/data × dev/prod) per ADR-001 (see `docs/adr/ADR-001-supabase-postgresql-kanonik.md`).
- Implement Supabase Edge Functions in TypeScript: request handling, RLS enforcement, input validation, error codes (FSD §3.6).
- Build workflow engine: form-triggered (ON_SUBMIT/ON_CHANGE), cron-scheduled, and queue-based task execution.
- SQL Guard: validate dynamic SQL from AI-generated DDL before execution (FSD §3.1.5).
- Implement RLS (Row-Level Security) policies for multi-tenant data isolation (FSD §3.5).
- Auth flows: Google OAuth, Supabase Auth, session management, deep-link redirect for Expo.

## Key documents

- `.opencode/documents/FSD.MD` — functional spec (DAL, RLS, Edge Functions, workflow engine, SQL Guard, error codes)
- `.opencode/documents/BRD.MD`, `.opencode/documents/PRD.MD` — business and product context
- BRD: FR-SEC-01..04, FR-AUT-01..03, NFR-PER-03
- PRD Module 1 (Auth & Project Mgmt), Module 3 (Distribution), Module 4 (Security)

## Boundaries

- This role produces backend implementation code, DAL, migrations, Edge Functions, and server-side logic.
- NEVER modify UI components, navigation, styles, or theming — apply `inline-role-ui-designer.md` for those.
- NEVER touch business-level documents (BRD/PRD) — apply `inline-role-business-analyst.md`.
- NEVER produce analysis without code unless asked — this is an implementation role.
- Keep tenant isolation: always validate schema context before querying tenant data.

## Output

- Clean, typed TypeScript with proper error handling (standardized error codes per FSD §3.6).
- DDL migrations with up/down or rollback support.
- Supabase Edge Functions with typed request/response shapes, validation, and error handling.
- RLS policies with clear mapping to tenant/user context.
- When reviewing backend code: flag security issues (SQL injection, broken RLS, unvalidated input) immediately.