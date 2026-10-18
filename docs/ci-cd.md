# CI/CD e dados cloud — BT-006

[BT-006](https://trello.com/c/3W4Ajz0j) · [SPEC-001](https://trello.com/c/vWo76DXs).

**Preparado localmente; ativação e aceite remoto pendentes.** Em 2026-10-18,
a conta GitHub `Jrmelo317` tem somente leitura em `Rebecamarini/FixIt`, sem
push/administração/secrets. O projeto Supabase já existe e a CLI está
autenticada, mas isso não fornece acesso ao GitHub Actions. Nenhum deploy de
migrations de domínio ou preparação de dados cloud foi executado por BT-006.
O cartão permanece incompleto até as evidências abaixo.

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
GitHub mantém no máximo um job ativo e um pendente por grupo, pode substituir
o pendente e não garante ordem FIFO. Portanto nem todo commit intermediário
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
| `SUPABASE_ACCESS_TOKEN` | Token pessoal com acesso ao projeto; preferir token com escopo mínimo necessário à CLI/migrations. |
| `SUPABASE_PROJECT_ID` | `gifqssocvuieagmndxwy` (identifica o destino, sem ser senha). |
| `SUPABASE_DB_PASSWORD` | Senha do PostgreSQL deste projeto; distinta da senha de teste/Auth e do token pessoal. |

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

Enquanto o acesso GitHub estiver somente leitura, ficam pendentes: publicação,
secrets, proteção, execuções remotas, promoção, preparação/validação de dados
cloud e evidências de falha/concorrência/preservação. Arquivos escritos e
verificação local não encerram o cartão.

Referências: [deploys Supabase](https://supabase.com/docs/guides/deployment/managing-environments),
[dependências de jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs),
[concorrência GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
