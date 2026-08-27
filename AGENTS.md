# Octapush Project

Rules are modular. Load order: this file + every file matching `.opencode/rules/*.md` (wired via `instructions` in `opencode.json`).

## Rule index

| File | Scope |
|---|---|
| `.opencode/rules/caveman-ultra.md` | Terse ultra-level response style, always active |
| `.opencode/rules/language-policy.md` | English for agentic docs, Bahasa Indonesia for reports + user chat |
| `.opencode/rules/request-reports.md` | Mandatory start/end report file per request (except pure Q&A & commit/push) |
| `.opencode/rules/inline-role-project-manager.md` | Project management & orchestration (inline, no subagent) |
| `.opencode/rules/inline-role-system-analyst.md` | System analysis & architecture (inline, no subagent) |
| `.opencode/rules/inline-role-business-analyst.md` | Business analysis & requirements (inline, no subagent) |
| `.opencode/rules/inline-role-ui-designer.md` | UI design & component implementation (inline, no subagent) |
| `.opencode/rules/inline-role-backend-developer.md` | Backend, DAL, migrations, Edge Functions (inline, no subagent) |
| `.opencode/rules/inline-role-qa-engineer.md` | Testing, QA gates, load-test (inline, no subagent) |
| `.opencode/rules/inline-role-devops.md` | CI/CD, Supabase/EAS setup, deployment (inline, no subagent) |
| `.opencode/rules/inline-role-ai-engineer.md` | AI provider integration & prompt engineering (inline, no subagent) |

## Verification

- Run lint/typecheck after code changes if scripts exist.

Do NOT append new rules directly here — create a new `.opencode/rules/<topic>.md` file instead.
