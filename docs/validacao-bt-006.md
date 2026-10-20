# Validação — BT-006

2026-10-18 · [BT-006](https://trello.com/c/3W4Ajz0j),
[SPEC-001](https://trello.com/c/vWo76DXs).

**Atualização de 2026-10-20:** o PR #1 foi integrado à `main`, com duas
promoções elegíveis aprovadas e dados cloud preparados/repetidos sem duplicação.
O [registro remoto detalhado](ci-cd.md#promoções-e-dados-compartilhados--2026-10-20)
contém SHAs, jobs, horários, hash de preservação e limites de concorrência,
proteção, revisão e advisors. A correção dos grants herdados de identidade também foi integrada no PR #3
e promovida no SHA `561d89425e1beec1fba8a009893e9aef8757df4c`: cinco
migrations remotas, API anônima de perfis e escrita de papel recusadas com
`42501`, mesmos dados e hash preservados após nova preparação.
Os resultados de 2026-10-18 abaixo são históricos.

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

Essa revisão não é evidência de execução remota ou concorrência real.

## Reprodução final local — 2026-10-18

Após integração de BT-004/BT-005, um clone Git limpo de
`integration/spec-001@ed3584d4a5b2dfbe76560268aea797086328b64c` executou
`npm ci`, `supabase db reset --local --no-seed --yes`, configuração pública
privada obtida da CLI e `npm run verify`: lint, tipos, build, cinco unitários e
treze integrações reais aprovados, sem skips. As duas migrations foram aplicadas
desde banco vazio na stack completa. A execução foi coordenada após os demais
trabalhos liberarem a stack; imagens/containers já existiam no host.

A preparação administrativa foi executada explicitamente duas vezes; quatro
contas autenticadas, 42 solicitações/eventos preservados e isolamento das duas
sessões Cliente confirmados. A página inicial respondeu HTTP 200 com conexão
ativa. Veja a [evidência completa e seus limites](validacao-spec-001.md).
A reprodução corresponde aos comandos do CI, mas não é uma execução GitHub
Actions e não comprova promoção remota, concorrência ou proteção ativa.

O [guia operacional](ci-cd.md) registra configuração, rotina separada de dados,
diagnóstico, acesso GitHub pendente e todas as evidências necessárias para o
aceite. Naquela data, secrets/proteção não tinham sido configurados e nenhuma
migration ou carga de dados tinha sido aplicada no cloud. Naquela rodada, o cartão permanecia incompleto.
