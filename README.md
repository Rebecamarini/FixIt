# FixIt

Aplicação web responsiva para gestão de solicitações de manutenção e bens patrimoniais, com os papéis Cliente, Manutentor e Gestor.

## Arquitetura vigente

Next.js fornece a interface e a coordenação das operações no servidor. O Supabase fornece Auth, PostgreSQL e a API REST gerada a partir do banco. RLS e permissões SQL protegem o acesso aos dados. Storage será usado quando a funcionalidade de anexos for implementada.

```text
Navegador → servidor Next.js → API REST do Supabase → PostgreSQL
```

A sessão usa cookies e `@supabase/ssr`. As operações de dados chegam ao Supabase com a identidade do usuário. O acesso direto à API também precisa respeitar RLS e permissões SQL.

BCE é aplicado como separação de responsabilidades: telas/formulários (Boundary), funções de coordenação no servidor (Control) e conceitos/dados do domínio com integridade no PostgreSQL (Entity). Não há exigência de classes BCE ou Singleton de sessão. Os contratos da aplicação serão documentados sem exigir uma API REST adicional no Next.js ou Swagger.

Cada desenvolvedor terá Supabase local com banco, Auth, API e Storage próprios. Um único projeto Supabase cloud gratuito atenderá integração e demonstração da entrega acadêmica; esses usos compartilham dados. Migrations versionadas compartilham a estrutura entre ambientes, sem sincronizar automaticamente seus dados.

## Estado do projeto

A entrevista da base técnica foi concluída; a implementação ainda não começou. Para configurar ferramentas, skills e conexões do agente, siga o [guia de início da equipe](docs/inicio-equipe.md). O [registro da preparação](docs/base-tecnica.md) contém decisões confirmadas e pendências. Veja também o [ADR de arquitetura](docs/adr/0001-nextjs-supabase.md), o [glossário](GLOSSARY.md) e as [fontes importadas](docs/references/README.md).

A [SPEC-001 — Base técnica](https://trello.com/c/vWo76DXs) consolida o trabalho aprovado, incluindo CI/CD e entrada da equipe. Há uma [cópia local da especificação](docs/specs/base-tecnica.md).

As tarefas são acompanhadas no [Trello](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit). João mantém usuários/autenticação; Paulo, criação/envio; Rebeca, consulta/autorização. A preparação não encerra as histórias do produto.
