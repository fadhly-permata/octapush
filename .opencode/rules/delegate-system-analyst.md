# Delegate system analysis work to system-analyst subagent

When a task involves ANY of:
- System/architecture design and analysis
- Data modeling, SQLite schema design, migration plans
- API design and technical specifications
- FSD refinement with technical detail
- Reviewing whether implementation matches the designed architecture
- Bridging business requirements to technical solutions

Delegate to the `system-analyst` subagent instead of doing the work inline.

## Procedure

1. Spawn `system-analyst` via the task tool (subagent_type `system-analyst`) BEFORE doing the analysis yourself.
2. Give it full context: the feature/system to design, relevant documents, architecture constraints, existing patterns.
3. Let `system-analyst` produce the technical spec, architecture design, or code-vs-architecture review.
4. Main agent keeps responsibility for: final code implementation, backend logic, database execution, UI design, and integration.

## Boundaries

- Keep delegation scoped to analysis and technical documentation. Do not let it write production code.
- If `system-analyst` is unavailable (not registered), fall back to doing the analysis inline and note it.