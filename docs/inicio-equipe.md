# Começar a desenvolver no FixIt

Guia para Rebeca e Paulo, atualizado em 2026-10-17. Cada pessoa configura as ferramentas e autoriza as conexões na própria conta. Clonar o repositório traz a documentação, mas não instala skills nem conecta serviços ao agente.

## 1. Entender o que já foi definido

Leia o [README](../README.md), as [decisões da base técnica](base-tecnica.md) e o [glossário](../GLOSSARY.md). O projeto usa Next.js, TypeScript, npm, CSS Modules e Supabase. Cada pessoa terá Supabase local; um cloud gratuito compartilhado servirá a integração e demonstração. O Next.js rodará localmente nesta etapa.

| Frente | Responsável | Preparação e contrato |
| --- | --- | --- |
| Usuários e autenticação | João | [S1-J01](https://trello.com/c/x3tAilqC): identidade e sessão |
| Criação e envio | Paulo | [S1-P01](https://trello.com/c/NO7qMjHP): solicitação e evento inicial |
| Consulta e autorização | Rebeca | [S1-R01](https://trello.com/c/OaAB6z5B): leitura, isolamento e dados de teste |

**Estado atual:** o grill está concluído, mas a base ainda não foi implementada. Ainda faltam aplicação, dependências, configuração local, projeto cloud, migrations, contas de teste e CI/CD. É possível preparar as ferramentas e conexões abaixo agora; os passos de execução da aplicação dependem da entrega da base. Configurar uma conta não significa que a integração foi testada.

## 2. Preparar a máquina e o GitHub

Instale [Git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/en/download) com npm e um runtime de containers. Quando a base estiver integrada, use a versão de Node fixada pelo projeto. Antes disso, a CLI Supabase exige Node 20 ou superior; a versão definitiva será fixada na implementação, não individualmente por cada pessoa. [Requisito oficial](https://supabase.com/docs/guides/local-development/cli/getting-started)

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

A referência fixa acima foi consultada para este guia e mantém a equipe na mesma revisão inicial. Atualizações devem ser combinadas. Os comandos `marketplace add --ref` e `plugin add` foram conferidos no `--help` do Codex desta sessão. Para outro agente, use as instruções do [autor](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/README.md); os comandos de plugin acima são específicos do Codex.

Se essas skills já estiverem instaladas manualmente, confira a origem antes de adicionar o pacote para evitar duplicatas. Nesta sessão existem skills manuais em `~/.codex/skills`; a documentação atual também descreve descoberta em `~/.agents/skills`. Não copie o caminho absoluto de outro desenvolvedor. [Locais de skills do Codex](https://learn.chatgpt.com/docs/build-skills)

Abra uma nova sessão após instalar o plugin e confirme que as skills aparecem no seletor. O pacote inclui o fluxo `ask-matt`, `grill-with-docs`, `to-spec`, `to-tickets` e `implement`, além das disciplinas `tdd`, `code-review`, `domain-modeling`, `codebase-design` e `pr`. As instruções de tracker, etiquetas e documentação já estão em [AGENTS.md](../AGENTS.md); o contexto deste projeto usa Trello, não issues de produto no GitHub.

Skills adicionais pessoais, como `ponytail` ou `no-mistakes`, não são distribuídas pelo Git deste projeto nem são pré-requisito deste guia. Se forem adotadas pela equipe, sua origem e instalação devem ser documentadas antes de depender delas.

**Pronto quando:** o agente encontra as skills e consegue ler as instruções do repositório.

## 4. Conectar os plugins/MCPs

Skill é uma instrução de trabalho; MCP fornece ferramentas de acesso a um serviço. Plugins podem reunir ambos. Instalar um plugin não concede automaticamente acesso aos arquivos ou projetos de outra pessoa.

No ChatGPT/Codex desktop, abra **Plugins**, pesquise o serviço e instale pelo botão **+** ou **Instalar**. No Codex CLI, abra `/plugins`. Complete **Conectar** quando solicitado e autentique com sua própria conta. Alguns serviços pedem conexão no primeiro uso. Abra uma nova conversa para carregar as ferramentas depois da instalação. [Instruções oficiais](https://learn.chatgpt.com/docs/plugins)

| Plugin/conexão | Para que usar | Acesso a confirmar |
| --- | --- | --- |
| Trello | Ler tarefas, critérios, comentários e dependências | [Board do FixIt](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit) |
| Google Drive | Consultar os documentos originais quando necessário | [Pasta do projeto](https://drive.google.com/drive/folders/19RsCtfuTNRDuvkRHMVTOGFHQsQk8NxgZ) |
| GitHub | Consultar código, PRs e verificações pelo agente | Repositório `Rebecamarini/FixIt` e permissões da própria conta |
| Supabase | Consultar documentação, projetos e banco pelo agente | Organização compartilhada e, após a criação, projeto `fixit-dev` |

O plugin Supabase inclui skills específicas de Supabase e boas práticas de PostgreSQL. A conexão do agente de João foi testada, mas isso não conecta os agentes de Rebeca e Paulo. Peçam ao administrador acesso à [organização do FixIt](https://supabase.com/dashboard/org/clpjmmkrnnuvvuwrhrgh) e, quando existir, ao projeto compartilhado. Não é necessário criar outro projeto cloud por desenvolvedor: cada um terá sua instância local.

As cópias em [referências](references/README.md) permitem leitura offline, mas são históricas. Antes de implementar, o agente precisa consultar o cartão ao vivo; se não conseguir, deve informar que o estado atual não foi verificado.

**Teste das conexões:** peça ao agente para ler DEC-001/DEC-002 no Trello, consultar um documento da pasta do Drive, ler os dados do repositório no GitHub e listar organizações/projetos no Supabase. São consultas de leitura; esse teste não deve criar recursos ou alterar cartões. Confira o resultado de cada serviço, não apenas se o plugin aparece instalado.

## 5. Configurar a aplicação quando a base estiver integrada

O primeiro caminho executável de BT-001 está no [guia de desenvolvimento local](desenvolvimento-local.md), com versões fixadas, `npm ci`, configuração de ambiente, início/parada da stack, aplicação e verificações. Siga esse guia para preparar o runtime; as demais entregas da base continuam nos cartões dependentes. A evidência e os impedimentos da execução estão no [registro de BT-001](validacao-bt-001.md).

Atualize sua cópia da branch principal. A entrega da base deve fornecer os itens abaixo; enquanto faltarem, a aplicação ainda não está pronta para desenvolvimento funcional.

| Item entregue pela base | Ação de cada pessoa |
| --- | --- |
| Versão Node, `package.json` e lockfile | Usar a versão indicada e instalar com `npm ci` |
| Exemplo de ambiente e instruções | Criar arquivo local ignorado pelo Git, escolhendo Supabase local ou cloud |
| CLI Supabase com versão fixada e configuração versionada | Usar a CLI do projeto e os comandos documentados, sem reinicializar o projeto |
| Migrations e rotina de dados de teste | Preparar somente seu banco local com os comandos entregues |
| Comandos de desenvolvimento e verificação | Executar a aplicação, lint, TypeScript, build e testes |
| Contratos e exemplos | Trabalhar com a mesma identidade, solicitação e histórico das outras frentes |

O arquivo de ambiente da aplicação será diferente das credenciais administrativas do agente e dos secrets do GitHub Actions. As chaves locais/cloud devem corresponder ao ambiente escolhido. Tokens pessoais, senha de banco e chaves administrativas ficam fora do Git e do código enviado ao navegador. Os nomes e comandos definitivos devem acompanhar os arquivos reais da implementação; este guia ainda não afirma que scripts `npm` da aplicação existem.

**Pronto quando:** aplicação abre localmente, Supabase local funciona, contas de teste autenticam, verificações passam e o teste com dois Clientes confirma isolamento dos dados. Conectar somente ao cloud não comprova que o ambiente local está funcionando.

## 6. Começar a própria tarefa

Escolha o cartão da sua frente, confirme escopo e responsáveis e crie uma branch por tarefa. O trabalho passa por PR, revisão de um colega e CI. Após integração e CI aprovado na `main`, o CD aplicará as migrations no cloud quando a automação estiver configurada. Preserve migrations integradas e use novas migrations para correções; desenvolvimento cotidiano acontece no banco local.

Para abrir uma sessão com contexto, cole no agente:

> Estou no FixIt, na frente de [Rebeca: consulta/autorização ou Paulo: criação/envio]. Leia AGENTS.md, docs/inicio-equipe.md, docs/base-tecnica.md, GLOSSARY.md e os ADRs relevantes. Leia meu cartão [URL] no Trello, incluindo comentários e checklists. Confira seus bloqueadores e os contratos compartilhados antes de implementar. Verifique minhas conexões e informe o que falta no ambiente; preserve a divisão de responsabilidades da Sprint 1.

## Checklist de entrada

- [ ] Li as decisões atuais e identifiquei meu cartão e seus bloqueadores.
- [ ] Tenho acesso pessoal ao GitHub, board do Trello e documentos do Drive.
- [ ] Tenho as skills disponíveis e as conexões do agente foram testadas.
- [ ] Git, Node/npm e runtime de containers funcionam no ambiente do agente.
- [ ] Após a entrega da base: dependências, ambiente, migrations e dados locais preparados.
- [ ] Após a entrega da base: aplicação e verificações passam com autenticação real.

Quem prepara a base deve atualizar este guia com os comandos reais, nomes das variáveis de ambiente e evidência do primeiro CI/CD, antes de sinalizar que Rebeca e Paulo podem começar a implementação funcional. Configuração dos secrets e proteção do GitHub exigirá uma conta autorizada: a conta consultada na sessão de planejamento tinha somente leitura.
