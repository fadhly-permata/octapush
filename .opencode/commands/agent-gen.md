---
description: Scaffold a new opencode subagent. Run a discussion about the agent's purpose and capabilities, then write the agent file to .opencode/agent/<name>.md.
---

You are scaffolding a new opencode subagent. The user's proposed agent is:

$ARGUMENTS

## Goal

Help the user define a single new subagent through a short discussion, then create its agent file. Do NOT create multiple agents at once unless the user explicitly asks.

## Discussion phase (do this first)

Ask the user, one question at a time, and let them answer before moving on. Cover at minimum:

1. **Name** — kebab-case, short, obvious (e.g. `ui-designer`, `data-analyst`).
2. **Purpose & responsibilities** — what tasks is this agent responsible for? What should it NEVER do?
3. **Mode** — `subagent` (spawned on demand, default), `primary` (user can switch to it), or `all`.
4. **Model** — which provider/model should it use? If unsure, suggest a sensible default from the project's available models. Ask whether it needs a stronger reasoning model or a cheaper/faster one.
5. **Permissions** — what tools can it use? Default recommendation: `edit: allow`, `bash: ask`. If it is read-only (analyst/reviewer), recommend `edit: deny`. Explicitly ask about: editing files, running bash, web access.
6. **Description** — 1–2 sentences used for `@`-autocomplete trigger. Front-load concrete trigger keywords so the model knows when to delegate to it.
7. **System prompt** — the instructions the agent operates under. Should be specific about its domain, constraints, output format, and boundaries (e.g. "never touch backend code").

If the user's $ARGUMENTS already covers some of these, don't re-ask; confirm and move on. If anything is ambiguous, ask ONE clarifying question before generating.

## Generation phase

After the discussion is settled, create the file at:

`.opencode/agent/<name>.md`

Use this exact frontmatter shape:

```markdown
---
description: <purpose + trigger keywords>
mode: <subagent|primary|all>
model: <provider/model-id>
permission:
  edit: <allow|deny|ask>
  bash: <allow|deny|ask>
---

<prompt body: domain, responsibilities, constraints, boundaries, output format>
```

Frontmatter notes:
- `description` is REQUIRED — agents without one are filtered out and never surface in `@` autocomplete.
- `mode: subagent` is the default for specialists; use `primary` only if the user wants to switch the whole session to it.
- `model` must carry a provider prefix (`provider/model-id`).
- Only include `permission` keys the user actually decided; do not invent permissions.
- Unknown frontmatter fields get routed into `options` — avoid them unless the user asks.

The prompt body must be written in English (project convention for agentic docs) and be specific: state the agent's domain, what it is responsible for, what it must never do, and how it should format output.

### Delegation rule (auto-spawn wiring)

ALWAYS create a second file that wires the main agent to auto-spawn this subagent when the task matches its domain:

`.opencode/rules/delegate-<name>.md`

Use this shape (English):

```markdown
# Delegate <domain> work to <name> subagent

When a task involves ANY of:
- <trigger bullets from the agent's description/domain>

Delegate to the `<name>` subagent instead of doing the work inline.

## Procedure

1. Spawn `<name>` via the task tool (subagent_type `<name>`) BEFORE doing the work yourself.
2. Give it full context: task description, scope, existing patterns, constraints.
3. Let `<name>` produce the result in its domain.
4. Main agent keeps responsibility for anything outside `<name>`'s domain.

## Boundaries

- Keep delegation scoped to `<name>`'s domain. Do not leak work into its files.
- If `<name>` is unavailable (not registered), fall back to doing the work inline and note it.
```

Do this for mode `subagent` agents. For `primary` agents, skip the delegation rule and say why. The rule is loaded automatically each session via `instructions: [".opencode/rules/*.md"]` in `opencode.json`, so no extra config is needed.

## Output

When done, show:
- The path to the agent file.
- The path to the delegation rule file.
- How to invoke the agent (`@<name> <task>`).
- A note that opencode must be restarted for the new agent to load.

Do not modify the user's `opencode.json` unless asked — the agent file enables `@`-autocomplete and the delegation rule auto-spawns it.
