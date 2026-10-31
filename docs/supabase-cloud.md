# Cloud compartilhado — BT-002

[BT-002](https://trello.com/c/fTQM6k2t), parte da [SPEC-001](https://trello.com/c/vWo76DXs). A aplicação Next.js continua local. O cloud é compartilhado somente para integração e demonstração com dados fictícios.

## Projeto existente e acesso pessoal

O projeto único `fixit-dev` tem referência `gifqssocvuieagmndxwy`, organização `clpjmmkrnnuvvuwrhrgh` e região **São Paulo (`sa-east-1`)**. Foi provisionado após consultar projetos existentes/cota e confirmar cotação de **US$ 0/mês**. Não crie outro projeto ao preparar uma máquina.

Em 2026-10-18 o [plano Free](https://supabase.com/pricing) inclui 500 MB de banco, 1 GB de Storage, 50 mil usuários ativos mensais e 5 GB de saída; limita a dois projetos ativos e pode pausar projetos após uma semana sem atividade. Backups automáticos não fazem parte desse plano. Confira limites no painel antes de ampliar o uso; não há autorização para contratar recursos pagos.

Cada pessoa precisa de conta própria no Supabase e convite aceito para a organização/projeto. O mantenedor concede o acesso necessário; não compartilhe conta nem token pessoal. O acesso do plugin/MCP, a sessão da CLI e os secrets do GitHub Actions são independentes. Para verificar a CLI com a própria conta:

```sh
npx --no-install supabase login
npx --no-install supabase projects list
```

Confirme o projeto existente, sem executar comandos de criação. O acesso administrativo do agente foi verificado pela listagem autenticada de projetos/chaves; a conexão da aplicação foi verificada separadamente com chave pública, sem privilégio administrativo.

## Selecionar o destino

Local: mantenha `.env.local` com `SUPABASE_TARGET=local`, URL `http://127.0.0.1:54321` e chave pública da sua stack local.

Cloud: copie `.env.example` para o arquivo ignorado `.env.cloud.local`, altere o destino/URL e obtenha a **Publishable key** desse mesmo projeto no [painel de API keys](https://supabase.com/dashboard/project/gifqssocvuieagmndxwy/settings/api). Preencha somente no arquivo local:

```dotenv
SUPABASE_TARGET=cloud
SUPABASE_URL=https://gifqssocvuieagmndxwy.supabase.co
SUPABASE_PUBLISHABLE_KEY=preencha-com-a-publishable-key-do-projeto
```

Na configuração pública `SUPABASE_PUBLISHABLE_KEY`, nunca use Secret key, service_role, senha do banco ou token da CLI; não os publique em mensagens ou commits. O helper compartilhado `getSupabaseConfig` recusa destino ausente, mistura local/cloud, URLs com credenciais/caminhos/parâmetros e chaves administrativas. Configuração permanece no servidor, sem prefixo `NEXT_PUBLIC_`.

Para diagnosticar e testar somente conexão/Auth settings do cloud sem tocar `.env.local`:

```sh
node --conditions=react-server --env-file=.env.cloud.local scripts/check-connection.ts
node --conditions=react-server --env-file=.env.cloud.local --test tests/connection.integration.ts
```

Esses comandos apenas leem serviços, sem aplicar migrations ou criar dados. Os demais testes de integração podem criar/remover dados fictícios; siga o guia de dados antes de apontá-los para cloud. Para usar cloud na aplicação Next.js, transfira esses três valores para `.env.local`, reinicie `npm run dev` e abra a página. Para retornar ao desenvolvimento local, restaure os três valores locais e reinicie. Não há sincronização automática entre ambientes.

O diagnóstico usa Auth health, uma consulta a um recurso reservado inexistente (`__fixit_connection_probe__`) que exige resposta exata HTTP 404/`PGRST205` do PostgREST e a listagem de buckets com chave pública. A resposta de Storage é descartada, sem nomes exibidos. Essa estratégia funciona mesmo quando o cloud restringe OpenAPI para chaves públicas. Comprova disponibilidade dos serviços e aceitação da chave; **não comprova leitura de linhas SQL, sessão de usuário ou RLS**. Esses comportamentos são verificados após as migrations de domínio.

## Configuração inicial do Auth

Auth usa e-mail/senha, senha mínima de oito caracteres e **nenhuma confirmação por e-mail** nos dois ambientes. Sem confirmação, o cadastro não comprova posse do endereço. Recuperação por e-mail/login externo não fazem parte desta base.

A configuração do serviço cloud é separada das migrations SQL. Em 2026-10-18, a CLI autenticada aplicou somente `auth.email.enable_confirmations=false`, `auth.minimum_password_length=8` e `auth.site_url=http://127.0.0.1:3000`. As outras configurações remotas foram preservadas. O arquivo mínimo versionado é `supabase/cloud-auth.toml`; não envie o `supabase/config.toml` completo do ambiente local, pois ele declara outros serviços e limites.

Para inspecionar ou reaplicar essa configuração com acesso administrativo autorizado, use um diretório temporário (a CLI exige `supabase/config.toml`):

```sh
cloud_config_dir=$(mktemp -d)
mkdir -p "$cloud_config_dir/supabase"
cp supabase/cloud-auth.toml "$cloud_config_dir/supabase/config.toml"
npx --no-install supabase config diff --project-ref gifqssocvuieagmndxwy --workdir "$cloud_config_dir"
# Revise as propriedades declaradas antes de confirmar o push interativo.
npx --no-install supabase config push --project-ref gifqssocvuieagmndxwy --workdir "$cloud_config_dir"
```

`remote_only` no diff significa propriedade não declarada que o push preserva. Não interprete isso como mudança a aplicar. A reaplicação foi verificada sem diferenças nas propriedades declaradas. A página Next.js em execução também retornou HTTP 200 com diagnóstico cloud conectado, sem chave no HTML. A leitura pública de `/auth/v1/settings` confirmou provedor e-mail ativo e `mailer_autoconfirm=true` local/cloud; os testes incluem essa verificação e rejeição de chave inválida. O mínimo de oito caracteres foi verificado pelo diff autenticado da configuração. Cadastro/sessão reais após o trigger de perfis são evidência separada de BT-003 e da promoção de migrations.

Nenhuma migration de negócio ou seed remoto foi aplicado por BT-002. A promoção depende de integração em `main`, CI aprovado do mesmo commit e CD; não execute reset remoto. O CD não publica Next.js.


## Capacidades administrativas restritas

O [ADR 0004](adr/0004-troca-email-auth-administrativa.md) autoriza a troca do
próprio e-mail após validar sessão e senha atual. A [US-004](https://trello.com/c/waxQ1rjj)
autoriza uma capacidade separada de consulta, criação e exclusão de contas por
Gestor ativo. Ambas usam `SUPABASE_SECRET_KEY` exclusivamente no servidor Next.js.
A chave pública continua obrigatória para
operações comuns. Configure a chave do ambiente correspondente somente em
`.env.local`/segredo do servidor, sem prefixo `NEXT_PUBLIC_` e sem Git. A CI gera
a chave local descartável sem imprimi-la. O segredo de runtime e as migrations
precisam ser instalados separadamente no ambiente de destino; esta capacidade
não altera configurações remotas por si só.
