# CI/CD e dados cloud — BT-006

[BT-006](https://trello.com/c/3W4Ajz0j) · [SPEC-001](https://trello.com/c/vWo76DXs).

**Base técnica integrada e CI/CD cloud comprovado em 2026-10-20.**
Os [PRs #1](https://github.com/Rebecamarini/FixIt/pull/1) e
[#3](https://github.com/Rebecamarini/FixIt/pull/3) estão integrados em `main`.
O SHA `561d89425e1beec1fba8a009893e9aef8757df4c` passou CI/CD, com cinco
migrations aplicadas e dados cloud preservados após repetição. As evidências
abaixo distinguem promoção, reaplicação e isolamento efetivamente executados
dos limites de revisão humana, proteção da branch e entrada individual.

## Verificação e promoção

`.github/workflows/verify-and-promote.yml` executa em PR e push para `main`,
sem filtros por arquivos. Node vem de `.nvmrc` (24.18.0), npm é 11.16.0;
`npm ci` instala o lockfile, incluindo a CLI Supabase 2.121.0. As actions estão
fixadas por SHA. Alterações de versões devem manter esses arquivos coerentes.

O job **CI** inicia a stack local completa, sem excluir serviços ou ignorar
health checks, e executa `db reset --local --no-seed` no runner descartável.
Assim todas as migrations são aplicadas desde banco vazio, sem depender de
cache de volumes, cloud ou seeds manuais. A conexão local pública é gravada em
`.env.local` sem imprimir chaves; a saída inicial da CLI fica apenas no runner,
sem upload de artefato. Auth/API/PostgreSQL/Storage são verificados pelos testes
reais. O cleanup apaga somente os volumes locais daquele runner.

`npm run verify` executa lint, tipos, build, testes unitários e
`test:integration`, nessa ordem, parando no primeiro erro. Os globs
`tests/*.test.ts` e `tests/*.integration.ts` incluem automaticamente os testes
de BT-004/BT-005; mantenha esses sufixos e diretório nos próximos cartões.
Não há skips por ausência de credenciais/serviços nem `continue-on-error`.

Para reproduzir em sua stack **local descartável**, feche outras sessões de
teste e siga o [guia local](desenvolvimento-local.md):

```sh
npm ci
npm run supabase:start
npx --no-install supabase db reset --local --no-seed --yes
# Configure .env.local conforme o guia local, sem imprimir/copiar chaves em logs.
npm run verify
```

O reset apaga dados locais. Não execute esta sequência em uma stack usada
simultaneamente por outra pessoa/processo, nem altere `--local` para cloud.

O job **Promote pending migrations** depende do sucesso de **CI** nessa mesma
execução e só roda no evento push de `main`. Ambos fazem checkout explícito de
`github.sha`. PRs não recebem secrets de deploy. O comando remoto é somente:

```sh
npx --no-install supabase db push --project-ref "$SUPABASE_PROJECT_ID" --skip-vault --yes
```

O workflow recusa referência diferente de `gifqssocvuieagmndxwy`. Aplica somente
migrations pendentes, sem seeds, roles ou atualização de Vault. Não faz reset,
`--include-all`, deploy de Next.js ou alteração automática das configurações
do Auth. A [configuração cloud do Auth](supabase-cloud.md) é procedimento separado.

O grupo de concorrência `supabase-gifqssocvuieagmndxwy`, no job de promoção,
tem `cancel-in-progress: false`: um push novo não cancela a migration ativa.
Com a configuração padrão usada aqui, GitHub mantém no máximo um job ativo e
um pendente por grupo e pode substituir o pendente. A ordem dos pushes não
garante a ordem das promoções. Portanto nem todo commit intermediário
necessariamente é promovido. Não execute outro workflow ou deploy manual em
paralelo; eles precisam respeitar a mesma coordenação. Um timeout/falha exige
inspecionar o histórico antes de repetir, sem reset remoto.

## Ativação por mantenedor com acesso

Após revisão de colega, o mantenedor precisa publicar/integrar o código neste
repositório e habilitar Actions. Nenhuma branch alternativa ou fork substitui
essa integração. Configure em **Settings → Secrets and variables → Actions →
Repository secrets**, com estes nomes exatos:

| Secret | Valor/origem |
| --- | --- |
| `SUPABASE_ACESS_TOKEN` | Token pessoal com acesso ao projeto; preferir token com escopo mínimo necessário à CLI/migrations. |
| `SUPABASE_PROJECT_ID` | `gifqssocvuieagmndxwy` (identifica o destino, sem ser senha). |
| `SUPABASE_DB_PASSWORD` | Senha do PostgreSQL deste projeto; distinta da senha de teste/Auth e do token pessoal. |

Por decisão explícita do usuário em 2026-10-20, o nome do secret no GitHub
é `SUPABASE_ACESS_TOKEN` (um C). O workflow mapeia esse secret para a variável
`SUPABASE_ACCESS_TOKEN` (dois Cs), exigida pela CLI Supabase.

O token deve permitir as operações exigidas pelo comando da CLI; teste sem
ampliar permissões indiscriminadamente. A documentação oficial descreve os
[secrets e permissões da CLI](https://supabase.com/docs/guides/deployment/managing-environments).
Login pessoal da CLI, plugin/MCP e secrets de Actions são acessos independentes.
Não imprima variáveis, `supabase status` completo, `env`, chaves, senhas ou
logs `--debug` no Actions. A chave administrativa de dados não é secret do CD.

Configure proteção/ruleset de `main`: exigir PR, uma aprovação de colega e
status **CI** aprovado, atualizado com a branch de destino; aplicar também aos
administradores e bloquear force push/remoção da branch. Se necessário, rode
o primeiro PR para o check aparecer na seleção. Confirme a regra efetivamente
ativa na UI/API. Se o plano/permissão não permitir proteção, registre o erro e
mantenha revisão/CI como convenção explícita; não declare proteção ativa.

Cada frente cria migration nova (`supabase migration new <nome>`), sem editar
migrations já integradas. Revise SQL e impacto sobre dados existentes no PR;
`db push` preservar o histórico não torna SQL destrutivo seguro. Faça merge
somente após os checks e a revisão. Consulte a execução do push para `main`:
o SHA, **CI** aprovado e **Promote pending migrations** devem corresponder.

## Preparação explícita de dados fictícios

Somente após o primeiro CD aprovado desse código, use a rotina existente
`scripts/prepare-test-data.ts` (`npm run prepare:test-data`). Consulte o
[contrato de identidade](contratos-identidade.md) para as quatro contas reais,
papéis, colisões e verificação de senha. Essa rotina fica fora do deploy.

Crie o arquivo ignorado `.env.cloud-data.local` com URL/chave pública do
projeto e estes valores (preencha as credenciais apenas no arquivo privado):

```dotenv
SUPABASE_TARGET=cloud
SUPABASE_URL=https://gifqssocvuieagmndxwy.supabase.co
SUPABASE_PUBLISHABLE_KEY=preencha-com-chave-publica
SUPABASE_SECRET_KEY=preencha-com-chave-administrativa
FIXIT_TEST_PASSWORD=preencha-com-senha-ficticia-de-ao-menos-oito-caracteres
FIXIT_PREPARE_CLOUD=confirmar-dados-ficticios
```

Restrinja a leitura do arquivo e execute a mesma rotina duas vezes, preservando
a mesma senha:

```sh
chmod 600 .env.cloud-data.local
node --conditions=react-server --env-file=.env.cloud-data.local scripts/prepare-test-data.ts
node --conditions=react-server --env-file=.env.cloud-data.local scripts/prepare-test-data.ts
```

O ambiente explícito tem precedência sobre `.env.local`. A confirmação cloud,
chave administrativa e senha são obrigatórias; não há senha cloud padrão.
Reexecuções verificam contas e sessões existentes sem trocar senhas ou promover
contas conflitantes. Dados adicionais de solicitações devem seguir o contrato
de BT-004/BT-005 e a mesma rotina idempotente, usando sessões reais dos Clientes;
nunca uma carga destrutiva automática. Não execute a suíte de integração no
cloud: seus testes são destrutivos e protegidos para alvo local.

Antes e depois da repetição, confira IDs/quantidades das quatro contas, perfis,
solicitações/eventos de exemplo e de um registro fictício independente. Faça
login com ambos os Clientes e verifique seus próprios dados e ausência de
dados alheios. Não registre tokens, senha ou chave na evidência. Colisão exige
revisão administrativa; não apague registros para forçar sucesso.

## Evidência necessária para concluir BT-006

- URL da execução em `main`, SHA e ambos os jobs aprovados; PR também com CI.
- Histórico remoto com as migrations desse SHA e nova execução do deploy
  informando ausência de pendências. Compare IDs/contagens antes/depois,
  incluindo registro fictício preexistente e carga repetida sem duplicação.
- Execução com falha real de CI e promoção ignorada; falhas de lint/tipos/build
  ou qualquer teste devem bloquear o job. Não introduza falha em `main` apenas
  para produzir evidência: use PR controlado para verificar a falha e registre
  separadamente que o gate de promoção é `needs: ci`.
- Duas promoções elegíveis com horários provando ausência de sobreposição e
  migration ativa não cancelada; configuração estática não é essa evidência.
- Preparação cloud repetida, quatro sessões reais, isolamento dos exemplos e
  Auth comum sem confirmação; proteção/checks efetivamente ativos ou limitação
  registrada.

## Primeira validação remota em PR — 2026-10-20

O [PR #1](https://github.com/Rebecamarini/FixIt/pull/1), no SHA
`e5231441b5eb96ebbfd1b82a83b6d2fc54dae221`, concluiu o
[workflow remoto](https://github.com/Rebecamarini/FixIt/actions/runs/39497092904)
com sucesso. O job **CI** iniciou a stack completa no runner, reconstruiu o
banco sem seed e aplicou as quatro migrations. Lint, tipos e build passaram;
foram aprovados cinco testes unitários e 26 integrações reais (15 testes
principais e 11 subtestes), zero falhas/skips. O cleanup também passou.
**Promote pending migrations** ficou `skipped`, pois o evento era PR.
Essa execução verifica esse SHA, não commits posteriores nem promoção cloud.

### Falha controlada de CI, fora de `main`

Após o baseline aprovado, o [PR #2](https://github.com/Rebecamarini/FixIt/pull/2)
foi aberto contra `integration/spec-001`, no SHA
`c1e1ee9d90aa0915f573616c0d90af43ec87c3a2`. A única mudança era um arquivo
temporário de duas linhas com variável deliberadamente não usada; nenhum
workflow foi alterado. A [execução real](https://github.com/Rebecamarini/FixIt/actions/runs/39497682151)
terminou com **CI: failure**, entre 21:06:46 e 21:09:54 UTC. A stack completa,
reset e conexão local passaram. O passo **Verify lint, types, build, unit and
all integration tests** parou no lint: `@typescript-eslint/no-unused-vars`,
linha 2:7 de `scripts/bt006-ci-failure-proof.ts`, uma warning acima do limite
zero; processo retornou 1. Os comandos seguintes de `verify` não rodaram.
Cleanup aprovado; **Promote pending migrations: skipped**.

O PR foi fechado sem merge e a branch remota `validation/bt-006-ci-failure`
foi removida após capturar a evidência. A falha deliberada não entrou em
`integration/spec-001` nem em `main`. O skip de promoção em PR também decorre
da condição de evento; esta prova demonstra falha real do CI, enquanto o gate
`needs: ci` permanece verificado na configuração do workflow.

### Limitações na rodada anterior à integração

Na consulta inicial desta sessão, a lista de repository secrets estava vazia.
Depois, `SUPABASE_PROJECT_ID` foi configurado separadamente pelo responsável
pela ativação. A consulta atual confirmou os nomes `SUPABASE_ACESS_TOKEN`,
`SUPABASE_DB_PASSWORD` e `SUPABASE_PROJECT_ID` configurados. Os valores não
foram acessados nem validados; a existência dos nomes não comprova acesso ao
projeto ou credenciais válidas. Autenticação pessoal na CLI não substitui esses
secrets.

`main` retornou `protected: false` e a lista de rulesets retornou vazia. A conta
atual não possui administração; o endpoint de permissões de Actions retornou
HTTP 403, embora as execuções sejam acessíveis. Portanto não há proteção de
branch comprovada. Revisão por colega e CI aprovado continuam sendo condições
explícitas antes da integração; até o fim daquela rodada, não havia merge em
`main`.

Ao encerrar aquela rodada, permaneciam pendentes promoção em `main` do mesmo
SHA aprovado, validação das credenciais no CD, revisão de colega, reaplicação, concorrência real, preservação
e preparação/validação de dados cloud. O ensaio de falha em PR não comprova execução do gate
no evento push: a promoção também fica ignorada em PR pela condição de evento.
A dependência `needs: ci` é a garantia estática registrada separadamente.

Referências: [deploys Supabase](https://supabase.com/docs/guides/deployment/managing-environments),
[dependências de jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs),
[concorrência GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## Promoções e dados compartilhados — 2026-10-20

O usuário integrou o PR #1 às **23:11:07 UTC**, pela conta `Jrmelo317`. O
GitHub registra o merge `ecbb8fc6c080c5ccb957e575d1af8e5f2f7222dc`.
A [execução de push/main](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989)
fez checkout desse SHA nos dois jobs. Em cada tentativa completa, CI passou
lint, tipos, build, cinco testes unitários e 26 integrações reais, sem
falhas/skips, com stack descartável completa e cleanup aprovado.

| Tentativa | CI (UTC) | Promoção (UTC) | Resultado remoto |
| --- | --- | --- | --- |
| [1](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/attempts/1) | [118939379731](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/job/118939379731), 23:11:12–23:14:35 | [118940649367](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/job/118940649367), 23:14:37–23:15:01 | Quatro migrations aplicadas; `Finished supabase db push.` |
| [2](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/attempts/2) | [118942142976](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/job/118942142976), 23:18:38–23:22:04 | [118943404750](https://github.com/Rebecamarini/FixIt/actions/runs/39513315989/job/118943404750), 23:22:06–23:22:40 | `Remote database is up to date.` |

As quatro migrations iniciais foram `20261017192224`, `20261018150507`,
`20261018152845` e `20261018152923`. A segunda tentativa reexecutou todos os
jobs, preservando evento, ref e SHA originais, conforme o
[comportamento documentado de reruns](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs).
As duas promoções elegíveis têm intervalos reais sem sobreposição e nenhuma
foi cancelada. Como foram sequenciais, não exercitaram disputa simultânea nem
fila de espera; a exclusão mútua também foi conferida separadamente no grupo
estático do workflow. Não houve novo push artificial ou deploy manual para
produzir essa evidência.

Após a primeira promoção, o cadastro comum da primeira conta Cliente usou o
contrato SSR real: houve sessão, cookies e confirmação automática, sem ação
por e-mail. Metadados tentando atribuir `Gestor` resultaram em perfil `Cliente`.
Essa conta foi preservada e identificada administrativamente como fixture;
a rotina padrão criou/verificou as demais três contas. Essa etapa adicional
comprova o cadastro comum; não é requisito oculto da rotina administrativa.

A preparação explícita foi repetida, preservando as quatro contas/perfis,
42 solicitações/eventos de exemplo e uma solicitação/evento fictício
independente criado pelo primeiro Cliente antes da repetição. Total: **43
solicitações e 43 eventos**, com 22 itens do primeiro Cliente e 21 do segundo.
As sessões reais das quatro contas passaram; listagem paginada, detalhe e
histórico próprios funcionaram, enquanto dados alheios permaneceram
inacessíveis pelo contrato do servidor e pela API direta.

A comparação das linhas ordenadas, incluindo IDs e instantes, manteve o
SHA-256 `31b424714218fa68a9387ce6a4567000d0fd4b049d83df211c83de9031bc5751`
após a carga repetida e após a segunda promoção, conferida às 23:23:40 UTC.
O diagnóstico cloud também confirmou Auth, REST e Storage. Não foi executada
a suíte destrutiva de integração no cloud, nem reset remoto.

### Privilégios e limites operacionais

A validação cloud encontrou privilégios `ALL` herdados para `anon` e
`authenticated` em `perfis` e `setores`; RLS restringia as linhas, mas esses
grants divergiam do contrato mínimo. A correção usa migration nova, preservando
as quatro já integradas, e segue o mesmo CI/CD; não houve DDL manual no cloud.
O PR #3 passou no [CI de PR](https://github.com/Rebecamarini/FixIt/actions/runs/39514496812)
e foi integrado às 23:26:04 UTC pela conta `Jrmelo317`, sem bypass de proteção.
O [CI/CD de push/main](https://github.com/Rebecamarini/FixIt/actions/runs/39514989761),
SHA `561d89425e1beec1fba8a009893e9aef8757df4c`, concluiu com sucesso:

| Job | Intervalo UTC | Evidência |
| --- | --- | --- |
| [CI 118944886958](https://github.com/Rebecamarini/FixIt/actions/runs/39514989761/job/118944886958) | 23:26:09–23:29:20 | Cinco migrations desde banco local vazio, lint, tipos, build, cinco unitários e 26 integrações aprovados, sem falhas/skips; cleanup aprovado. |
| [Promoção 118946022522](https://github.com/Rebecamarini/FixIt/actions/runs/39514989761/job/118946022522) | 23:29:22–23:29:48 | Aplicou somente `20261020231724_identity_explicit_client_grants.sql`; `Finished supabase db push.` |

Às **23:30:53 UTC**, o histórico cloud continha as cinco migrations. A
conferência de privilégios confirmou ausência de INSERT/UPDATE/DELETE/TRUNCATE
para `anon` e `authenticated` nas duas tabelas. SELECT ficou somente em
`setores` para ambos e em `perfis` para autenticados. A API anônima recusou
leitura de `perfis` com `42501`; a tentativa autenticada de alterar o próprio
papel para `Gestor` também retornou `42501`, preservando `Cliente`.

A preparação padrão foi executada novamente após a quinta migration. As
quatro contas/perfis e 43 solicitações/eventos mantiveram o mesmo SHA-256
registrado acima, incluindo o registro independente. Quatro sessões SSR,
paginação dos Clientes (22/21), detalhe/histórico próprios, a mesma resposta
`nao_encontrado` para UUIDs inexistentes/alheios e listas vazias pela API direta
passaram novamente.
Auth/REST/Storage continuaram acessíveis. Nenhum dado foi removido para obter
sucesso, e nenhuma migration integrada foi editada.

A conta atual tem push, sem administração. `main` está com `protected: false`
e sem rulesets ativos comprovados. Os três secrets foram configurados e o
sucesso do CD validou seu uso, sem divulgar valores. Os PRs #1 e #3 não
possuem revisão humana formal
`APPROVED` registrada. O usuário realizou o merge inicial; a correção passou
por revisões automatizadas independentes de padrões e especificação, sem
achados, e foi integrada pelo agente dentro da autorização de concluir a
entrega. A conta efetiva dos merges foi `Jrmelo317`. Revisão automatizada é
evidência distinta de aprovação humana. Exigir PR, revisão de colega e CI
permanece convenção da equipe; proteção de branch não é declarada ativa.

Os advisors cloud de segurança retornaram um **WARN**,
`auth_leaked_password_protection`. A proteção contra senhas vazadas está
desabilitada e exige [plano Pro ou superior](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
O projeto permanece gratuito, conforme a restrição de custo; nenhuma contratação
foi feita. Advisors de desempenho retornaram três **INFO** de índices de chaves
estrangeiras ainda sem uso (`perfis_setor_id`, `solicitacoes_categoria_id` e
`historico_autor_id`), zero WARN/ERROR. Esses índices foram mantidos para os
vínculos previstos; uma carga de 43 exemplos não justifica removê-los.

Os resultados executados em `main` pertencem aos SHAs indicados. A atualização
documental passa por PR, revisão e CI antes da integração; ela não altera
as evidências dos commits anteriores. O Next.js continua local; esta entrega não publica endereço
web nem transfere credenciais/conexões pessoais dos colegas.
