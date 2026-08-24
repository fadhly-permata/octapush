# Octapush Project

Rules are modular. Load order: this file + every file matching `.opencode/rules/*.md` (wired via `instructions` in `opencode.json`).

## Rule index

| File | Scope |
|---|---|
| `.opencode/rules/caveman-ultra.md` | Terse ultra-level response style, always active |
| `.opencode/rules/language-policy.md` | English for agentic docs, Bahasa Indonesia for reports + user chat |
| `.opencode/rules/request-reports.md` | Mandatory start/end report file per request |

## Verification

- Run lint/typecheck after code changes if scripts exist.

Do NOT append new rules directly here — create a new `.opencode/rules/<topic>.md` file instead.
