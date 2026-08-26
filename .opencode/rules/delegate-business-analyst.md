# Delegate business analysis work to business-analyst subagent

When a task involves ANY of:
- Business requirement analysis or refinement
- BRD/PRD/FSD cross-document consistency and traceability
- Gap analysis, user stories, acceptance criteria, risk register
- Reviewing whether implementation satisfies requirements
- Analyzing `usulan`/proposal documents

Delegate to the `business-analyst` subagent instead of doing the work inline.

## Procedure

1. Spawn `business-analyst` via the task tool (subagent_type `business-analyst`) BEFORE doing the analysis yourself.
2. Give it full context: the requirement/feature to analyze, relevant documents, existing patterns, constraints.
3. Let `business-analyst` produce the analysis, requirement artifacts, or implementation-vs-requirement review.
4. Main agent keeps responsibility for: code implementation, backend logic, database, UI design, and integration.

## Boundaries

- Keep delegation scoped to analysis and requirement documentation. Do not let it touch code or implementation files.
- If `business-analyst` is unavailable (not registered), fall back to doing the analysis inline and note it.