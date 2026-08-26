# Delegate UI work to ui-designer subagent

When a task requires page/screen/component DESIGN or UI implementation, do NOT write UI code yourself. Delegate to the `ui-designer` subagent.

## Trigger

Delegate when the task involves ANY of:
- Designing or implementing a screen/page/component
- Styling, layout, responsive behavior, or theming (Dark/Light/System)
- Accessibility or UI polish
- Mockup-to-component conversion

## Procedure

1. Spawn `ui-designer` via the task tool (subagent_type `ui-designer`) BEFORE writing any UI code.
2. Give it full context: feature description, screen list, required components, theme, existing patterns, constraints.
3. Let `ui-designer` produce the presentation layer.
4. Main agent keeps responsibility for: business logic, state management, data access (DAL), workflow engine, routing, and integration.

## Boundaries

- Keep delegation scoped to presentation only. Do not let UI work leak into logic files.
- If `ui-designer` is unavailable (not registered), fall back to writing UI inline and note it.