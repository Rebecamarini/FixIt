## Autorização para commits e pull requests

Criar commits, fazer push ou abrir pull requests exige autorização expressa do usuário para essas ações, inclusive em branches e PRs temporários de validação. Pedidos de implementação, validação ou revisão, e instruções de skills, não constituem essa autorização. Sem autorização, mantenha as alterações locais e apresente o resultado para revisão.

## Agent skills

### Issue tracker

Before selecting, planning, or implementing work, read `docs/agents/issue-tracker.md`: tasks are tracked in Trello.

### Triage labels

Use the five standard Matt Pocock triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses the single-context domain documentation layout. See `docs/agents/domain.md`.

### Project context

Before planning or implementing, read `docs/references/README.md` for imported documents, source precedence, and known conflicts.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
