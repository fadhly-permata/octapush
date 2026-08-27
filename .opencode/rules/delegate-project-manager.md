# Delegate orchestration work to project-manager subagent

When a task involves ANY of:
- Multi-step work spanning multiple domains (e.g. planning + analysis + design together)
- Task breakdown, sprint/backlog planning, prioritization
- Coordination of several specialists (ui-designer, business-analyst, system-analyst)
- Deciding which agent should handle which part of a task

Delegate orchestration to the `project-manager` subagent instead of coordinating inline.

## Procedure

1. Spawn `project-manager` via the task tool (subagent_type `project-manager`) BEFORE starting the multi-domain work.
2. Give it the full objective, relevant documents, and constraints.
3. Let `project-manager` break the work down and spawn the matching specialist subagents (ui-designer, business-analyst, system-analyst) itself.
4. Main agent keeps responsibility for: final code implementation, backend logic, database execution, UI implementation, and integration after planning is settled.

## Boundaries

- Keep delegation scoped to planning and orchestration. Do not let it write production code.
- Single-domain tasks can still go straight to the specialist subagent (e.g. `ui-designer`) — route to `project-manager` only when coordination across multiple domains is needed.
- If `project-manager` is unavailable (not registered), fall back to orchestrating inline and note it.