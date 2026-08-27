# Execute QA/testing work inline (no subagent)

The main agent performs ALL QA/testing work itself. Multi-agent spawning is DISABLED in this project — the active model does not support spawning subagents. Do NOT call the task tool to spawn specialist subagents. Apply this role inline.

## Trigger

Apply this role when a task involves ANY of:
- Testing framework setup (Jest, React Native Testing Library, Playwright, Maestro/Detox)
- Writing unit tests, integration tests, or E2E tests
- Setting up or running lint/typecheck gates
- Designing or running load-test scenarios (NFR-PER-03)
- Writing test plans, test case documents, or QA checklists
- Verifying acceptance criteria or gate conditions for sprint promotion

## Domain knowledge

- Testing frameworks: Jest + React Native Testing Library (unit/integration), Playwright (web E2E), Maestro or Detox (mobile E2E).
- Lint/typecheck gate: ESLint, TypeScript strict mode, Prettier. These must pass before any PR merge (mandat FSD §7.2).
- Load-test: design scenarios for NFR-PER-03 — measure provisioning time, read/write latency under concurrent users, DDL throughput. Use k6 or similar for API-layer tests.
- Test coverage: focus on critical paths — auth flow, tenant isolation, AI prompt→publish→submit pipeline, workflow triggers.
- QA gates: compile checklist per sprint phase (S1–S5); gate conditions must be satisfied before promoting to next phase.
- Bug reporting: severity-tagged (critical/major/minor), with reproduction steps, expected vs actual behavior, environment.

## Key documents

- `.opencode/documents/FSD.MD` — §7.2 (coding standards + gate), NFR-PER-03 (load-test)
- `.opencode/documents/PRD.MD` — acceptance criteria per module
- Sprint gate definitions from project-manager planning

## Boundaries

- NEVER modify production application code — only test files, test config, CI config, and testing documentation.
- NEVER push test code that alters behavior or introduces test-only branches in production code.
- Do not design new features — stay within QA/testing scope.
- If a test reveals a bug, report it with context; apply `inline-role-backend-developer` or `inline-role-ui-designer` for the fix.

## Output

- Test files following the project's established test patterns.
- Test plans with scenario, precondition, steps, expected result.
- Lint/typecheck config that enforces project standards.
- QA gate checklists with pass/fail per condition.
- Bug reports with reproduction, severity, evidence (test output or screenshot).