# Domain Docs

Before exploring the codebase, read:

- `GLOSSARY.md` at the repository root.
- Relevant ADRs under `docs/adr/`.

If these files do not exist, proceed silently. The domain-modeling skills
create them lazily when terminology or architectural decisions are resolved.

## Layout

This repository uses a single-context layout:

/
├── GLOSSARY.md
├── docs/adr/
└── src/

Use terminology defined in `GLOSSARY.md` consistently. If proposed work
contradicts an existing ADR, surface the conflict explicitly instead of
silently overriding the decision.
