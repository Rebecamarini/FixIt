# Validação da SPEC-001 e entrada da equipe

2026-10-18 · [SPEC-001](https://trello.com/c/vWo76DXs) ·
[BT-007](https://trello.com/c/iZhZxnWc).

**Base técnica integrada e validada em 2026-10-20.**
Os [PRs #1](https://github.com/Rebecamarini/FixIt/pull/1) e
[#3](https://github.com/Rebecamarini/FixIt/pull/3) foram integrados à `main`.
O SHA final de código `561d89425e1beec1fba8a009893e9aef8757df4c` passou
[CI/CD](https://github.com/Rebecamarini/FixIt/actions/runs/39514989761):
cinco migrations, lint, tipos, build, cinco unitários e 26 integrações reais,
sem falhas/skips. O cloud recebeu somente migrations pendentes; a preparação
repetida preservou quatro contas/perfis, 43 solicitações e 43 eventos,
incluindo registro independente. Sessões reais, privilégios e isolamento
passaram após a correção incremental de grants de identidade.
O [registro de BT-006](ci-cd.md#promoções-e-dados-compartilhados--2026-10-20)
contém jobs, horários, hash e limites. Os registros abaixo preservam a
reprodução histórica de 2026-10-18 e as rodadas seguintes; entrada individual
e aprovação formal humana não são inferidas dessas verificações.

## Reprodução local desde checkout limpo

Código verificado: `integration/spec-001@ed3584d4a5b2dfbe76560268aea797086328b64c`.
Foi feito clone Git novo em diretório temporário, sem copiar `node_modules`,
`.next` ou arquivos de ambiente ignorados. A origem foi o repositório local de
integração porque a `main` remota ainda não contém a entrega. Isso verifica o
checkout desse commit, não disponibilidade da implementação no GitHub.

Ferramentas efetivas: Git 2.43.0, Node 24.18.0, npm 11.16.0, CLI Supabase
2.121.0 instalada pelo lockfile e Docker Engine/cliente 29.1.3 no Ubuntu/WSL.
Docker já estava instalado, com imagens em cache e os 12 containers completos
em execução. O teste não representa uma máquina sem Docker nem mede o download
inicial. Nesta sessão foi usado `sg docker -c '...'` para aplicar o grupo Docker.

| Execução | Evidência |
| --- | --- |
| `npm ci` | 364 pacotes instalados; lockfile sem alteração. Auditoria reportou cinco vulnerabilidades high existentes; sem atualização de dependências fora do escopo. |
| `npx --no-install supabase db reset --local --no-seed --yes` | Banco local reconstruído; aplicadas `20261017192224_identity_profiles` e `20261018150507_requests_initial_history`. Sem SQL manual adicional. |
| Configuração privada | `.env.local` criado com modo `0600` a partir de `supabase status --output json`, gravando somente destino local, URL e Publishable/anon key. Nenhuma chave impressa ou copiada do outro checkout. |
| `npm run verify` | Lint, tipos e build aprovados; cinco unitários e treze integrações reais aprovados, zero skips/falhas. O comando e os globs são os mesmos usados pelo workflow. |
| `npm run prepare:test-data`, duas execuções explícitas | As quatro contas autenticaram; quatro perfis, 42 solicitações e 42 eventos. Comparação completa das linhas ordenadas por ID antes/depois confirmou preservação de valores, IDs e instantes. |
| Sessões reais independentes dos dois Clientes | Cada conta recebeu páginas de 20, 1 e 0 itens e total 21; detalhe/histórico próprios acessíveis. UUID alheio retornou `nao_encontrado` em ambos os contratos; API direta retornou lista vazia para solicitação e histórico alheios. |
| `npm run check:connection` | Auth, PostgREST e Storage responderam pelo servidor com chave pública. |
| `npm start` e requisição HTTP real | Página inicial HTTP 200 com `data-connection-status="connected"`; servidor temporário encerrado depois. |
| Estado ao terminar | Clone sem alterações rastreadas; stack completa continuou executando, sem serviços excluídos, com os 42 exemplos/eventos preservados. |

A comparação dos dados de preparação produziu o mesmo SHA-256 nas duas leituras:
`c42961d33bb054f2b43b6d8b69ebc4ebce5906732edebe437f62fde73e15b8f2`.
A suíte também testa preservação de solicitação fictícia adicional durante
repetição da carga e remove somente seus dados temporários. Nenhuma validação
destrutiva foi executada no cloud.

## Correções da revisão final local — 2026-10-18

A revisão de padrões não encontrou problemas; a revisão da especificação encontrou
dois achados P2, ambos corrigidos: trim Unicode incompleto e coerção de metadados
JSON não textuais em nome/matrícula. As pendências remotas abaixo continuam abertas.

Duas regressões pela fronteira aprovada Auth/API/PostgreSQL foram executadas antes
das correções. BOM isolado nos dois campos e normalização de pontas falharam;
números, booleanos, arrays e objetos nos dois campos foram indevidamente aceitos
(oito casos). Cada ciclo passou após sua migration. Contas inesperadamente aceitas
na fase vermelha foram removidas pelo cleanup dos próprios testes.

As novas migrations `20261018152845_identity_javascript_trim` e
`20261018152923_identity_metadata_text` foram geradas pela CLI e aplicadas com
`supabase migration up --local`, sem modificar as migrations integradas.
Comparação de todas as linhas de perfis, solicitações e histórico, ordenadas por ID,
produziu MD5 `6b8bc86d1b674de3e9a4bb6038a85e2f` antes/depois: quatro perfis,
42 solicitações e 42 eventos preservados. Nenhum perfil é normalizado silenciosamente:
constraints novas falham se dados existentes exigirem reconciliação administrativa.

Depois dessa comprovação incremental, um reset **somente local** aplicou as quatro
migrations desde banco vazio para verificar reconstrução. A reprodução anterior
por clone limpo permanece como evidência histórica do SHA indicado acima; esta
rodada usa worktree próprio derivado de `integration/spec-001@417b2d8`, `npm ci`
e ambiente local privado `0600`. Não representa novo clone limpo.

A primeira tentativa de `npm run verify` fora de `sg docker` passou lint, tipos,
build, cinco unitários e 25/26 testes de integração; a preparação em processo filho
falhou por falta do grupo Docker ativo. A execução completa foi repetida com
`sg docker -c 'npm run verify'`, como orienta o guia local.
Resultado final: lint, tipos, build, cinco unitários e 26 integrações (15 testes
principais e 11 subtestes) aprovados, sem falhas/skips. Advisors locais de segurança
e desempenho retornaram zero achados. `npm ci` manteve o lockfile e instalou 364
pacotes; as cinco vulnerabilidades high existentes permanecem fora deste ajuste.

Após o rebuild e a suíte, duas execuções explícitas de `prepare:test-data`
autenticaram as quatro contas e preservaram quatro perfis, 42 solicitações e
42 eventos. O MD5 das linhas ordenadas nas duas leituras foi
`7d78fb823879b1a4b1a6b443de81fb70` (novo conjunto após reset local; não se compara
aos IDs anteriores). Os 12 containers completos continuam em execução. Nenhuma
migration, preparação ou operação destrutiva foi feita no cloud; sem push remoto.

## CI remoto — 2026-10-20

A branch de integração foi publicada no
[PR #1](https://github.com/Rebecamarini/FixIt/pull/1). O SHA
`e5231441b5eb96ebbfd1b82a83b6d2fc54dae221` passou no
[GitHub Actions](https://github.com/Rebecamarini/FixIt/actions/runs/39497092904):
stack completa, reset local do runner sem seed, quatro migrations, lint,
tipos, build, cinco unitários e 26 integrações (15 testes principais e 11
subtestes), sem falhas/skips; cleanup aprovado. A promoção foi ignorada por
ser evento de PR. Essa evidência não substitui CI/CD do SHA integrado em
`main`, revisão de colega nem validação dos dados cloud. O [ensaio controlado em PR separado](https://github.com/Rebecamarini/FixIt/actions/runs/39497682151)
falhou realmente no lint, com cleanup aprovado e promoção ignorada. O PR de
ensaio foi fechado sem merge e sua branch removida. As condições atuais de
secrets/proteção e os limites dessa prova estão em [BT-006](ci-cd.md).

## Ferramentas do agente e conexões

| Acesso | Verificação nesta sessão | O que ainda não comprova |
| --- | --- | --- |
| Skills Matt Pocock | Origem e manifesto de `mattpocock/skills@49dd158d1076134a641b33efb035946536778336` lidos; nomes do marketplace/plugin e diretórios das skills conferidos. Codex CLI 0.163.0 confirma `marketplace add --ref` e `plugin add` no help. | Instalação/revisão efetiva dos agentes de Rebeca e Paulo; plugins podem atualizar no início da sessão. |
| Trello | Cartão BT-007 relido pelo conector em 2026-10-18: Em Implementação, sem membros, comentários ou checklists adicionais; dependente de BT-005/006, requisitos preservados. BT-001 a BT-005 em Concluído; BT-006 e SPEC-001 em implementação. | Autorizações pessoais dos colegas; estado futuro do board. |
| Google Drive | Plugin conectado leu metadados e conteúdo do [Trabalho 02](https://docs.google.com/document/d/1uxobkjnoZNWWNNLMemSuqC0e1liynxe4bRn7kBHi2CE/edit), associado à pasta do projeto. | Acesso de Rebeca/Paulo por suas próprias conexões. Nenhum documento foi alterado. |
| GitHub CLI | `gh api user` confirmou `Jrmelo317`; `gh api repos/Rebecamarini/FixIt` confirmou `pull: true`, `push: false`, `admin: false`, `maintain: false`. | Conexão GitHub do agente e acesso dos colegas; leitura/clonagem de repo público não demonstra escrita. |
| Supabase plugin/MCP | Listagem autenticada retornou apenas `fixit-dev`, `gifqssocvuieagmndxwy`, organização compartilhada, `sa-east-1`, `ACTIVE_HEALTHY`. | CLI/Actions dos colegas, secrets GitHub ou migrations/dados de domínio no cloud. A conexão pública/Auth cloud tem registro separado em [BT-002](supabase-cloud.md). |

As instruções de plugins e descoberta de skills foram reconferidas na
[documentação oficial de plugins](https://learn.chatgpt.com/docs/plugins) e
[skills](https://learn.chatgpt.com/docs/build-skills), além do help local.
O [guia da equipe](inicio-equipe.md) orienta instalação, autenticação pessoal,
consultas de leitura, contratos e responsabilidades. Clonar não instala skills
nem transfere autorizações. Não foram enviados convites/mensagens ou criados
recursos externos durante essas verificações.

## Estado compartilhado e entrada individual — 2026-10-20

A integração, os secrets usados pelo CD, as duas promoções do mesmo SHA, a
carga repetida e a preservação dos dados cloud foram comprovados. A falha real
de lint em PR separado e a configuração `needs: ci` são evidências distintas:
o skip em PR também decorre da condição de evento. Duas promoções sequenciais
comprovam ausência de sobreposição observada; não são teste de disputa pela
fila. Veja [BT-006](ci-cd.md) para os limites completos.

A conta `Jrmelo317` agora possui push, sem administração. `main` permanece sem
proteção/ruleset ativo comprovado. O merge inicial pelo usuário é fato
registrado; os PRs #1 e #3 não possuem
aprovação humana formal `APPROVED`. A correção foi revista por dois agentes
independentes (padrões/especificação), sem achados, e integrada dentro da
autorização de concluir a entrega. Revisão de colega/CI permanecem convenção,
separada dessas revisões técnicas automatizadas.
O advisor cloud de segurança registra um WARN de proteção contra senhas
vazadas, recurso pago não habilitado no projeto gratuito; três INFO de índices
FK sem uso constam no advisor de desempenho, sem WARN/ERROR nesse advisor.

A correção incremental `20261020231724_identity_explicit_client_grants` foi
promovida pelo CI/CD do SHA final. Às 23:30:53 UTC, o cloud tinha cinco
migrations, quatro usuários/perfis e 43 solicitações/eventos. Leitura anônima
de perfis e tentativa autenticada de promover o próprio papel foram recusadas
com `42501`; o papel permaneceu `Cliente`. A carga padrão foi repetida após
essa promoção; o SHA-256 das linhas ordenadas continuou
`31b424714218fa68a9387ce6a4567000d0fd4b049d83df211c83de9031bc5751`,
igual às leituras anteriores à repetição inicial e após a reaplicação.
Não houve reset, exclusão de dados, DDL manual cloud ou publicação do Next.js.
A atualização documental passa por PR, revisão e CI antes da integração;
as evidências executadas em `main` referem-se aos SHAs explicitamente indicados.

Rebeca e Paulo ainda precisam instalar/conferir skills, conectar suas próprias
contas e repetir a preparação local em suas máquinas. O guia e a evidência da
sessão de João não comprovam essas autorizações pessoais. Essas etapas de
entrada individual continuam no [checklist da equipe](inicio-equipe.md#checklist-de-entrada).

A base técnica não encerra as histórias funcionais da Sprint 1. Os contratos,
o [guia local](desenvolvimento-local.md) e os registros históricos/importados
permanecem como referência para as próximas frentes.
