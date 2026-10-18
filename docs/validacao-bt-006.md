# Validação parcial — BT-006

2026-10-18 · [BT-006](https://trello.com/c/3W4Ajz0j),
[SPEC-001](https://trello.com/c/vWo76DXs).

Base de implementação: `integration/spec-001@fcd5924` (BT-001/002/003).

| Verificação executada | Resultado |
| --- | --- |
| `npm ci` com Node 24.18.0/npm 11.16.0 | Aprovado, lockfile preservado. Auditoria reporta cinco vulnerabilidades high nas dependências existentes; nenhuma atualização fora do escopo aplicada. |
| actionlint 1.7.12 no workflow novo | Aprovado, sem erros. Binário de validação externo ao repositório. |
| `npm run lint` | Aprovado. |
| `npm run typecheck` | Aprovado. |
| `npm run build` | Aprovado. |
| `npm test` | Cinco testes aprovados, sem skips. |
| `git diff --check` | Aprovado. |

A revisão estática confirma eventos PR/main, checkout do mesmo `github.sha`,
`needs: ci`, deploy exclusivo de push/main, grupo fixo com
`cancel-in-progress: false`, CLI instalada pelo lockfile e `db push` sem reset,
seed ou `--include-all`. A stack inicia completa e o reset está explicitamente
limitado a `--local` no runner descartável. Os globs existentes incluem todos
os arquivos de integração futuros que sigam a convenção.

Essa revisão não é evidência de execução remota ou concorrência real. A
reprodução da suíte final desde banco vazio depende da integração de
BT-004/BT-005 e da coordenação da stack local compartilhada durante o trabalho.
BT-006 não reiniciou/resetou a stack usada pelos outros cartões.

O [guia operacional](ci-cd.md) registra configuração, rotina separada de dados,
diagnóstico, acesso GitHub pendente e todas as evidências necessárias para o
aceite. Secrets/proteção não foram configurados; nenhuma migration ou carga
de dados foi aplicada no cloud. O cartão permanece incompleto.
