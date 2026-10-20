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

**Base local implementada; aceite completo pendente (2026-10-18).** BT-001 a BT-005 entregam aplicação, identidade, solicitação/histórico e consultas com RLS. O workflow de BT-006 está preparado e a reprodução local está registrada em [validação da SPEC-001](docs/validacao-spec-001.md). A conta GitHub consultada permanece sem escrita/administração/secrets: publicação, integração na `main`, CI/CD remoto, migrations/dados cloud e prontidão completa de BT-007 ainda estão pendentes. Para configurar ferramentas, skills e conexões do agente, siga o [guia de início da equipe](docs/inicio-equipe.md). O [registro da preparação](docs/base-tecnica.md) contém decisões confirmadas e pendências. Veja também o [ADR de arquitetura](docs/adr/0001-nextjs-supabase.md), o [glossário](GLOSSARY.md) e as [fontes importadas](docs/references/README.md).

A [SPEC-001 — Base técnica](https://trello.com/c/vWo76DXs) consolida o trabalho aprovado, incluindo CI/CD e entrada da equipe. Há uma [cópia local da especificação](docs/specs/base-tecnica.md).

As tarefas são acompanhadas no [Trello](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit). João mantém usuários/autenticação; Paulo, criação/envio; Rebeca, consulta/autorização. A preparação não encerra as histórias do produto.
