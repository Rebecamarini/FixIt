# FixIt

Aplicação web responsiva para gestão de solicitações de manutenção e bens patrimoniais, com os papéis Cliente, Manutentor e Gestor.

## Arquitetura vigente

Next.js fornece a interface e a coordenação das operações no servidor. O Supabase fornece Auth, PostgreSQL e a API REST gerada a partir do banco. RLS e permissões SQL protegem o acesso aos dados. Storage será usado quando a funcionalidade de anexos for implementada.

```text
Navegador → servidor Next.js → API REST do Supabase → PostgreSQL
```

A sessão usa cookies e `@supabase/ssr`. As operações de dados chegam ao Supabase com a identidade do usuário. O acesso direto à API também precisa respeitar RLS e permissões SQL.

BCE é aplicado como separação de responsabilidades: telas/formulários (Boundary), funções de coordenação no servidor (Control) e conceitos/dados do domínio com integridade no PostgreSQL (Entity). Não há exigência de classes BCE ou Singleton de sessão. Os contratos da aplicação estão documentados em [identidade](docs/contratos-identidade.md) e [solicitações](docs/contratos-solicitacoes.md) sem exigir uma API REST adicional no Next.js ou Swagger.

Cada desenvolvedor usa Supabase local com banco, Auth, API e Storage próprios. Um único projeto Supabase cloud gratuito (`fixit-dev`, São Paulo) atenderá integração e demonstração da entrega acadêmica; esses usos compartilham dados. Migrations versionadas compartilham a estrutura entre ambientes, sem sincronizar automaticamente seus dados.

## Estado do projeto

Na branch da [US-001](https://trello.com/c/nxKsfzLE), o autocadastro está integrado ao Auth real: `/conta/cadastrar` cria Cliente e redireciona a `/conta/entrar`, sem manter a sessão automática. O login leva à página inicial com nome e opção “Sair”. A entrega também avança a US-002. Veja as [decisões e o roteiro de aceite](docs/specs/us-001-autocadastro.md).

**Base técnica integrada e validada (2026-10-20).** Os [PRs #1](https://github.com/Rebecamarini/FixIt/pull/1) e [#3](https://github.com/Rebecamarini/FixIt/pull/3) estão na `main`. CI/CD do SHA `561d89425e1beec1fba8a009893e9aef8757df4c` passou: cinco migrations, cinco testes unitários e 26 integrações reais. Quatro contas e 43 solicitações/eventos cloud foram preservados após carga repetida e reaplicação; sessões e isolamento passaram. A [validação da SPEC-001](docs/validacao-spec-001.md) registra evidências e limites: `main` sem proteção ativa comprovada, ausência de aprovação humana formal nos PRs e configuração pessoal dos colegas ainda individual. Para começar sua frente, siga o [guia da equipe](docs/inicio-equipe.md). Veja também as [decisões confirmadas](docs/base-tecnica.md), o [ADR de arquitetura](docs/adr/0001-nextjs-supabase.md), o [glossário](GLOSSARY.md) e as [fontes importadas](docs/references/README.md).

A [SPEC-001 — Base técnica](https://trello.com/c/vWo76DXs) consolida o trabalho aprovado, incluindo CI/CD e entrada da equipe. Há uma [cópia local da especificação](docs/specs/base-tecnica.md).

As tarefas são acompanhadas no [Trello](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit). João mantém usuários/autenticação; Paulo, criação/envio; Rebeca, consulta/autorização. A preparação não encerra as histórias do produto.
