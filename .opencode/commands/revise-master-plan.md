---
description: Revise the master planning documents (BRD.MD, PRD.MD, FSD.MD) based on the requested change.
---

You are revising the project master plan documents. The user's change request is:

$ARGUMENTS

## Target files (in this order)

1. `.opencode/documents/BRD.MD` — Business Requirements Document
2. `.opencode/documents/PRD.MD` — Product Requirements Document
3. `.opencode/documents/FSD.MD` — Functional Specification Document

## Procedure

1. Read all three documents fully before making any edit. Understand their current structure, numbering conventions, and terminology.
2. Analyze the user's request and determine its impact on each document:
   - BRD: business objectives, stakeholders, business requirements affected.
   - PRD: features, user stories, scope, acceptance criteria affected.
   - FSD: functional details, flows, data models, UI/UX specs affected.
3. Apply the revision to every document where it is relevant. If a change has no impact on a document, skip that document and say why.
4. Keep each document's existing structure, heading hierarchy, numbering, and style intact. Integrate new content as if it were always part of the plan.
5. Maintain cross-document consistency: the same feature must use the same name and terminology in BRD, PRD, and FSD. Traceability matters — a requirement in the PRD should map back to a business need in the BRD and forward to a spec in the FSD.
6. Do not delete or rewrite unrelated sections. Make surgical edits.
7. If the request is ambiguous, ask clarifying questions BEFORE editing.

## Output

At the end, summarize:
- What changed in each document (section-level list).
- Any open questions or assumptions made.
