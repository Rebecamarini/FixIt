# Executar o FixIt localmente — BT-001

Entrega de [BT-001](https://trello.com/c/n4BRJlnF), parte da [SPEC-001](https://trello.com/c/vWo76DXs). Execute os comandos na raiz do repositório. Este caminho prepara a aplicação inicial; consulte também o [guia do cloud compartilhado](supabase-cloud.md) para BT-002.

## Ferramentas

- Git.
- Node.js **24.18.0** e npm **11.16.0**, fixados em `.nvmrc` e `package.json`.
- Docker Desktop ou outro runtime com API Docker, instalado e iniciado. No Windows/WSL 2, habilite a integração com a distribuição onde o projeto está clonado.

Com nvm já instalado, execute `nvm install` e `nvm use`. Confira:

```sh
node --version
npm --version
docker version
```

Docker deve mostrar **cliente e servidor**. Se faltar o comando ou a conexão com o daemon falhar, corrija o runtime antes de iniciar Supabase. Consulte a [instalação oficial](https://docs.docker.com/get-started/get-docker/) e o [guia da CLI Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started). Não é necessário login na Supabase nem projeto cloud para executar localmente.

## Alternativa no Ubuntu/WSL 2 com systemd

Docker Engine pode executar dentro da distribuição, sem Docker Desktop. No Ubuntu 24.04 desta validação, o pacote `docker.io` forneceu Docker 29.1.3:

```sh
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Abra uma nova sessão de terminal após adicionar o grupo e confira `docker version`. Na sessão atual, `sg docker -c 'docker version'` aplica o grupo para um comando; o mesmo funciona para `sg docker -c 'npm run supabase:start'`. O grupo Docker concede controle administrativo do host; adicione somente desenvolvedores que já tenham esse acesso. Não instale esta alternativa em paralelo com uma integração Docker Desktop já configurada.

## Primeira execução

```sh
npm ci
npx --no-install supabase --version
npm run supabase:start
cp .env.example .env.local
npm run supabase:status
```

`supabase:start` usa a CLI fixada no projeto e `supabase/config.toml`. O primeiro início baixa imagens e pode demorar. Não execute `supabase init` novamente e não exclua serviços no comando de início: a stack inclui banco, Auth, API e Storage. As portas padrão precisam estar livres.

Edite `.env.local` com a URL local e a **Publishable key** exibidas pela CLI. Se a saída usar **anon key**, use essa chave no mesmo campo:

```dotenv
SUPABASE_TARGET=local
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=preencha-com-a-chave-local
```

O arquivo é ignorado pelo Git. Não use Secret key, `service_role`, senha do banco ou token pessoal. Não copie a saída completa de `supabase:status` para commits, prints ou mensagens: ela contém credenciais administrativas locais. Essas variáveis são exclusivas do servidor, sem prefixo `NEXT_PUBLIC_`.

```sh
npm run check:connection
npm run dev
```

Abra <http://127.0.0.1:3000>. A página consulta Auth, a API REST do PostgreSQL e Storage pelo servidor, sem cache, e mostra somente um diagnóstico fixo. Use “Verificar novamente” para refazer a consulta. Reinicie o Next.js após alterar o ambiente. O comando `check:connection` reutiliza a mesma verificação e retorna código 1 se configuração/conexão falharem.

O diagnóstico acessa Auth health, PostgREST por um recurso reservado inexistente (resposta exata HTTP 404/`PGRST205`) e Storage com a chave pública. Não exibe dados de buckets. Essa verificação comprova disponibilidade e aceitação da chave, sem consultar tabelas de aplicação; sessão e isolamento são verificados separadamente. A configuração exige seleção explícita `SUPABASE_TARGET=local` ou `cloud`, com URL do mesmo destino. Consulte o [guia cloud](supabase-cloud.md) para alternar com segurança.

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm start
```

`npm test` verifica diagnósticos de configuração e falha de conexão/chave recusada, sem simular Auth. `test:integration` exige `.env.local` válido e a stack real iniciada: ausência de serviços/configuração **falha** o teste, sem skip ou sucesso artificial. Execute ambos para avaliar a entrega completa.

`typecheck` gera os tipos de rotas antes do TypeScript, inclusive em clone limpo. O build pode funcionar sem Supabase: a página é renderizada no servidor a cada acesso, e a conexão é verificada em runtime. Build aprovado isoladamente não comprova integração.

Para encerrar o desenvolvimento, interrompa Next.js com Ctrl+C e execute:

```sh
npm run supabase:stop
```

A parada e o reinício foram verificados com um registro descartável em esquema privado; o registro permaneceu após reiniciar. O comando preserva os dados locais. Não adicione `--no-backup` para encerrar normalmente. A stack contém Storage, mas a funcionalidade de anexos ainda não está implementada.

## Diagnóstico

| Situação | Ação |
| --- | --- |
| Versão de Node/npm incompatível | Use `.nvmrc` e confira as versões antes de `npm ci`. |
| Docker ausente ou sem servidor | Instale/inicie o runtime e habilite a integração WSL; confira `docker version`. |
| Porta ocupada ao iniciar Supabase | Encerre a outra stack local que ocupa as portas 54321–54327; não altere só a URL da aplicação. |
| Configuração ausente | Copie `.env.example` para `.env.local` e preencha os três campos. |
| Configuração inválida | Use a URL raiz local e chave Publishable/anon; chaves administrativas e URLs com credenciais, caminhos ou parâmetros são recusadas. |
| Supabase indisponível ou chave recusada | Confira `supabase:start`, `supabase:status` e a chave do mesmo ambiente. |

Migrations, contas reais de teste e contratos de sessão serão acrescentados nos cartões dependentes. Este cartão não exige criar usuários fictícios nem abrir acesso a dados protegidos.
