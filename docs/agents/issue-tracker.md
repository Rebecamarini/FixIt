# Issue tracker: Trello

Tasks, stories, sprint planning, and scope decisions live in the
[Backlog do Produto — FixIt](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit).
GitHub hosts code and pull requests.

## Before implementing

- Read the live target card, including checklists and relevant comments, through the connected Trello tools.
- Read DEC-001 (scope) and DEC-002 (Sprint 1) when relevant; links and a dated snapshot are in `docs/references/`.
- Preserve identifiers such as US-001 and S1-J01 and link the original card in implementation notes and PRs.
- Confirm the current list and assignment. Descriptions and member assignments can disagree.
- If live access is unavailable, use the snapshot as historical context and report that the current state could not be verified.

## Skill conventions

“Fetch the relevant ticket” means read its Trello card. When explicitly asked to
publish a spec or tickets, use cards on this board and link the parent spec.
Record blockers as `Blocked by: <card URL>` when native dependencies are unavailable;
check every blocker before starting dependent work.

Use the existing lists for planning and progress: Dúvidas/Decisões, Backlog do
Produto, Pronto para Implementação, Sprint 1 — Rebeca/João/Paulo,
Em Implementação, Code Review, Em Teste, and Concluído.
Completion requires the card's acceptance criteria, including integration where specified.
Create, move, or modify cards within the user's requested task.

The GitHub label mapping in `triage-labels.md` is separate from Trello's existing
product labels and lists; it does not replace them.
