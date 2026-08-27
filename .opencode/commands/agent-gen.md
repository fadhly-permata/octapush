---
description: Scaffold a new inline-role rule. Run a discussion about the role's purpose and capabilities, then write the rule file to .opencode/rules/inline-role-<name>.md.
---

You are scaffolding a new inline-role rule for the OctaPush project. The user's proposed role is:

$ARGUMENTS

## Context

This project runs ALL work on the main agent — multi-agent spawning is DISABLED (the active model does not support spawning subagents). Roles are applied inline: the main agent reads the matching `.opencode/rules/inline-role-*.md` and follows its domain knowledge, boundaries, and output format itself. There are no subagent definitions.

## Goal

Help the user define a single new role through a short discussion, then create its rule file. Do NOT create multiple roles at once unless the user explicitly asks.

## Discussion phase (do this first)

Ask the user, one question at a time, and let them answer before moving on. Cover at minimum:

1. **Name** — kebab-case, short, obvious (e.g. `data-analyst`, `qa-engineer`).
2. **Purpose & responsibilities** — what domain is this role responsible for? What should it NEVER do?
3. **Trigger** — when should the main agent apply this role? (e.g. "when a task involves API design", "when reviewing accessibility").
4. **Description** — 1–2 sentences describing scope for the rule title and trigger section.

If the user's $ARGUMENTS already covers some of these, don't re-ask; confirm and move on. If anything is ambiguous, ask ONE clarifying question before generating.

## Generation phase

After the discussion is settled, create the file at:

`.opencode/rules/inline-role-<name>.md`

Use this exact shape (English):

```markdown
# Execute <name> work inline (no subagent)

The main agent performs ALL <name> work itself. Multi-agent spawning is DISABLED in this project — the active model does not support spawning subagents. Do NOT call the task tool to spawn specialist subagents. Apply this role inline.

## Trigger

Apply this role when a task involves ANY of:
- <trigger bullets>

## Domain knowledge

- <what the role knows and does>

## Boundaries

- <what the role must never do>

## Output

- <expected output format>
```

Notes:
- The rule body must be written in English (project convention for agentic docs).
- Model the file on the existing roles in `.opencode/rules/` (`inline-role-project-manager.md`, `inline-role-system-analyst.md`, `inline-role-business-analyst.md`, `inline-role-ui-designer.md`) — mirror their section structure and wording.
- Trigger section: front-load concrete trigger keywords so the main agent knows when to apply the role.
- Boundaries section: state explicitly what the role must not do (e.g. "Never modify the DAL").
- Do NOT create a subagent definition (`.opencode/agent/*.md`) and do NOT create a `delegate-*.md` rule — this project has no subagents.
- Do NOT modify `opencode.json` — rules in `.opencode/rules/*.md` load automatically via `instructions`.

## Output

When done, show:
- The path to the rule file.
- A note that opencode must be restarted for the new rule to load into the current session's context.
