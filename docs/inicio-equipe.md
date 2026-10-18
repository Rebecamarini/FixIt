# Começar a desenvolver no FixIt

Guia para Rebeca e Paulo, atualizado em 2026-10-18. Cada pessoa configura as ferramentas e autoriza as conexões na própria conta. Clonar o repositório traz a documentação, mas não instala skills nem conecta serviços ao agente.

## 1. Entender o que já foi definido

Leia o [README](../README.md), as [decisões da base técnica](base-tecnica.md) e o [glossário](../GLOSSARY.md). O projeto usa Next.js, TypeScript, npm, CSS Modules e Supabase. Cada pessoa terá Supabase local; um cloud gratuito compartilhado servirá a integração e demonstração. O Next.js rodará localmente nesta etapa.

| Frente | Responsável | Preparação e contrato |
| --- | --- | --- |
| Usuários e autenticação | João | [S1-J01](https://trello.com/c/x3tAilqC): identidade e sessão |
| Criação e envio | Paulo | [S1-P01](https://trello.com/c/NO7qMjHP): solicitação e evento inicial |
| Consulta e autorização | Rebeca | [S1-R01](https://trello.com/c/OaAB6z5B): leitura, isolamento e dados de teste |

**Estado atual:** BT-001 a BT-005 estão implementados na integração local da
SPEC-001: aplicação, stack local, identidade, criação, consulta e dados fictícios.
O cloud `fixit-dev` existe em São Paulo (`gifqssocvuieagmndxwy`), mas ainda não
recebeu as migrations de domínio nem os dados. BT-006 tem workflow preparado;
a conta GitHub `Jrmelo317` consultada continua sem push/administração/secrets.
A base ainda não foi integrada à `main` remota nem teve CI/CD remoto comprovado.
BT-007 e a prontidão completa permanecem parciais até resolver esse bloqueio.
O [registro de validação](validacao-spec-001.md) distingue execução local,
conexões verificadas e autorizações pessoais ainda não conferidas.

## 2. Preparar a máquina e o GitHub

Instale [Git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/en/download) com npm e um runtime de containers. Use Node **24.18.0** e npm **11.16.0**, fixados em `.nvmrc` e `package.json`; com nvm, execute `nvm install` e `nvm use`. A CLI Supabase **2.121.0** vem do lockfile, sem instalação global. Consulte o [guia local](desenvolvimento-local.md).

No Windows, use [Docker Desktop com WSL 2](https://docs.docker.com/desktop/setup/install/windows-install/) ou Docker Engine dentro do Ubuntu/WSL com systemd, conforme a alternativa validada no [guia local](desenvolvimento-local.md#alternativa-no-ubuntuwsl-2-com-systemd). Se desenvolver dentro do WSL, habilite a integração do Docker Desktop com essa distribuição e execute Git, Node e npm no mesmo ambiente em que o agente trabalha. Em Linux/macOS, use um runtime compatível com a API Docker conforme o [guia local do Supabase](https://supabase.com/docs/guides/local-development).

No terminal de desenvolvimento, confira:

```sh
git --version
node --version
npm --version
docker version
```

`docker version` precisa mostrar cliente e servidor; mostrar apenas o cliente não comprova que o runtime está funcionando.

Entre no GitHub com sua própria conta, confirme o acesso de colaboração ao [repositório FixIt](https://github.com/Rebecamarini/FixIt) e clone:

```sh
git clone https://github.com/Rebecamarini/FixIt.git
cd FixIt
```

O repositório é público: conseguir clonar não comprova permissão para publicar branches. Caso use GitHub CLI, execute `gh auth login` e `gh auth status`. A autenticação do Git/CLI e a conexão GitHub do agente devem ser verificadas separadamente. Um administrador precisa conceder o acesso adequado; compartilhar credenciais pessoais não é necessário.

**Pronto quando:** repositório aberto no ambiente de desenvolvimento, ferramentas respondendo e acesso de colaboração confirmado.

## 3. Instalar as skills do agente

O pacote usado para o fluxo de trabalho vem de [mattpocock/skills](https://github.com/mattpocock/skills). A instalação é por pessoa. No Codex CLI, o caminho documentado pelo autor é:

```sh
codex plugin marketplace add mattpocock/skills --ref 49dd158d1076134a641b33efb035946536778336
codex plugin add mattpocock-skills@mattpocock
```

A referência fixa acima foi consultada para este guia e mantém a equipe na mesma revisão inicial. Atualizações devem ser combinadas. Os comandos `marketplace add --ref` e `plugin add` foram reconferidos no `--help` do Codex CLI **0.163.0** em 2026-10-18; o manifesto da revisão confirma os nomes `mattpocock` e `mattpocock-skills`. A instalação não foi refeita nas contas dos colegas. Para outro agente, use as instruções do [autor](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/README.md); os comandos de plugin acima são específicos do Codex.

Se essas skills já estiverem instaladas manualmente, confira a origem antes de adicionar o pacote para evitar duplicatas. Nesta sessão existem skills manuais em `~/.codex/skills`; a documentação atual também descreve descoberta em `~/.agents/skills`. Não copie o caminho absoluto de outro desenvolvedor. [Locais de skills do Codex](https://learn.chatgpt.com/docs/build-skills)

Abra uma nova sessão após instalar o plugin e confirme que as skills aparecem no seletor. O pacote inclui o fluxo `ask-matt`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement` e `implement-spec`, além das disciplinas `tdd`, `code-review`, `domain-modeling`, `codebase-design` e `pr`. O plugin pode atualizar no início da sessão; antes de atualizar, confira a revisão efetiva e combine a mudança com a equipe. A revisão indicada é a referência inicial do guia. As instruções de tracker, etiquetas e documentação já estão em [AGENTS.md](../AGENTS.md); o contexto deste projeto usa Trello, não issues de produto no GitHub.

Skills adicionais pessoais, como `ponytail` ou `no-mistakes`, não são distribuídas pelo Git deste projeto nem são pré-requisito deste guia. Se forem adotadas pela equipe, sua origem e instalação devem ser documentadas antes de depender delas.

**Pronto quando:** o agente encontra as skills e consegue ler as instruções do repositório.

## 4. Conectar os plugins/MCPs

Skill é uma instrução de trabalho; MCP fornece ferramentas de acesso a um serviço. Plugins podem reunir ambos. Instalar um plugin não concede automaticamente acesso aos arquivos ou projetos de outra pessoa.

No ChatGPT desktop, abra **Plugins**, pesquise o serviço e instale. A extensão IDE não oferece o navegador de plugins; use o desktop ou a CLI. No Codex CLI, abra `/plugins`. Complete **Conectar** quando solicitado e autentique com sua própria conta. Alguns serviços pedem conexão no primeiro uso. Abra uma nova conversa para carregar as ferramentas depois da instalação. [Instruções oficiais](https://learn.chatgpt.com/docs/plugins)

| Plugin/conexão | Para que usar | Acesso a confirmar |
| --- | --- | --- |
| Trello | Ler tarefas, critérios, comentários e dependências | [Board do FixIt](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit) |
| Google Drive | Consultar os documentos originais quando necessário | [Pasta do projeto](https://drive.google.com/drive/folders/19RsCtfuTNRDuvkRHMVTOGFHQsQk8NxgZ) |
| GitHub | Consultar código, PRs e verificações pelo agente | Repositório `Rebecamarini/FixIt` e permissões da própria conta |
| Supabase | Consultar documentação, projetos e banco pelo agente | Organização compartilhada e projeto `fixit-dev` (`gifqssocvuieagmndxwy`) |

O plugin Supabase inclui skills específicas de Supabase e boas práticas de PostgreSQL. A conexão do agente de João foi testada, mas isso não conecta os agentes de Rebeca e Paulo. Peçam ao administrador acesso à [organização do FixIt](https://supabase.com/dashboard/org/clpjmmkrnnuvvuwrhrgh) e ao [projeto compartilhado](https://supabase.com/dashboard/project/gifqssocvuieagmndxwy). Não é necessário criar outro projeto cloud por desenvolvedor: cada um terá sua instância local.

As cópias em [referências](references/README.md) permitem leitura offline, mas são históricas. Antes de implementar, o agente precisa consultar o cartão ao vivo; se não conseguir, deve informar que o estado atual não foi verificado.

**Teste das conexões:** peça ao agente para ler DEC-001/DEC-002 no Trello, consultar um documento da pasta do Drive, ler os dados do repositório no GitHub e listar organizações/projetos no Supabase. São consultas de leitura; esse teste não deve criar recursos ou alterar cartões. Confira o resultado de cada serviço, não apenas se o plugin aparece instalado.

## 5. Executar a base local

Após a publicação e integração da base, atualize sua `main`. Enquanto isso,
somente o checkout local de integração contém a entrega; clonar a `main` remota
não comprova que esse código esteja disponível. Siga o [guia local](desenvolvimento-local.md)
para Docker e configuração privada de `.env.local`:

```sh
npm ci
npm run supabase:start
cp .env.example .env.local
# Preencha somente URL e Publishable/anon key locais, conforme o guia local.
npm run check:connection
npm run verify
npm run prepare:test-data
npm run prepare:test-data
npm run dev
```

Na primeira criação do banco local, o início aplica as migrations. Para comprovar reconstrução completa
em sua stack **local descartável**, antes de `verify`, execute
`npx --no-install supabase db reset --local --no-seed --yes`. O reset apaga
os dados locais e precisa ser coordenado com qualquer processo usando a stack.
Não use reset no cloud. Cada desenvolvedor usa seu próprio banco local.

`.env.local` contém `SUPABASE_TARGET=local`, `SUPABASE_URL=http://127.0.0.1:54321`
e `SUPABASE_PUBLISHABLE_KEY`, sem `NEXT_PUBLIC_`; nunca chave administrativa.
No cloud, configure o destino e chave pública conforme [BT-002](supabase-cloud.md).
Conexão pública cloud disponível não significa que contratos/dados já existam.
Credenciais administrativas e secrets de Actions são acessos separados.

`verify` executa lint, TypeScript, build, cinco testes unitários e treze
integrações reais atuais. Falta de stack/ambiente falha a suíte. Os globs incluem
novos testes que sigam as convenções existentes. `prepare:test-data` autentica
as quatro contas e prepara 21 solicitações e eventos por Cliente; a repetição
preserva os dados. As credenciais fictícias locais e o roteiro de isolamento
estão em [identidade](contratos-identidade.md) e [solicitações](contratos-solicitacoes.md).
A rotina administrativa cloud fica separada do CD e depende da primeira
promoção aprovada; siga [CI/CD](ci-cd.md), sem executar testes destrutivos lá.

Abra <http://127.0.0.1:3000>: esta página inicial diagnostica conexão pelo
servidor. As telas de login, envio e consulta continuam nas histórias da Sprint 1.
Verifique os contratos com sessões reais pela suíte/rotina e pelo roteiro;
não espere uma jornada de produto pronta. Encerre Next.js com Ctrl+C;
`npm run supabase:stop` preserva os dados locais.

**Pronto localmente quando:** aplicação abre, `verify` passa, a carga repetida
não duplica registros e ambos os Clientes consultam somente os próprios dados.
O aceite completo ainda exige as evidências remotas de [BT-006](ci-cd.md).

## 6. Começar a própria tarefa

Escolha o cartão da sua frente, confirme escopo e responsáveis e crie uma branch por tarefa. O trabalho passa por PR, revisão de um colega e CI. Após integração e CI aprovado na `main` do mesmo commit, o CD aplicará somente migrations pendentes no cloud, quando secrets e Actions estiverem ativos e verificados. Veja [CI/CD](ci-cd.md). Cada frente é responsável pelas migrations e contratos que evoluir; gere uma migration nova com `npx --no-install supabase migration new <nome>`, sem editar migrations integradas ou dos colegas. Combine alterações compartilhadas no PR, com revisão de um colega e CI aprovado. João mantém identidade/sessão; Paulo usa `criarSolicitacao`; Rebeca usa listagem, detalhe e histórico do [mesmo contrato](contratos-solicitacoes.md). Desenvolvimento cotidiano acontece no banco local.

Para abrir uma sessão com contexto, cole no agente:

> Estou no FixIt, na frente de [Rebeca: consulta/autorização ou Paulo: criação/envio]. Leia AGENTS.md, docs/inicio-equipe.md, docs/base-tecnica.md, GLOSSARY.md e os ADRs relevantes. Leia meu cartão [URL] no Trello, incluindo comentários e checklists. Confira seus bloqueadores e os contratos compartilhados antes de implementar. Verifique minhas conexões e informe o que falta no ambiente; preserve a divisão de responsabilidades da Sprint 1.

## Checklist de entrada

- [ ] Li as decisões atuais e identifiquei meu cartão e seus bloqueadores.
- [ ] Tenho acesso pessoal ao GitHub, board do Trello e documentos do Drive.
- [ ] Tenho as skills disponíveis e as conexões do agente foram testadas.
- [ ] Git, Node/npm e runtime de containers funcionam no ambiente do agente.
- [ ] Dependências, ambiente, migrations e dados locais preparados.
- [ ] Aplicação e verificações passam com autenticação real.

A reprodução local e as conexões da sessão de João estão no [registro de validação](validacao-spec-001.md). Rebeca e Paulo ainda precisam autorizar/testar as próprias contas e executar seu checklist. A primeira execução CI/CD, secrets, proteção e dados cloud permanecem pendentes; até lá, não há prontidão completa declarada.
