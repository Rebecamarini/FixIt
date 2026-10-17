# Next.js e Supabase como infraestrutura do FixIt

Decisão confirmada pelo usuário em 2026-10-17, durante a preparação da base técnica. O FixIt usa uma única aplicação web responsiva em Next.js e Supabase gerenciado para Auth, PostgreSQL e, quando a US-008 for implementada, Storage. Essa escolha segue a evolução do Trabalho 02 e substitui a arquitetura Spring Boot/React/Flutter ainda descrita no README histórico.

O Supabase é considerado infraestrutura do próprio FixIt, uma exceção explícita à redação sobre serviços externos da [DEC-001](https://trello.com/c/iQhgWOan). Permanecem excluídos login institucional/social, integrações institucionais e notificações por canais externos. A escolha reduz a infraestrutura a implementar, em troca de dependência dos serviços e configurações do Supabase.

O projeto não deve exigir gastos com serviços. Ambientes, hospedagem e seus limites serão definidos dentro dessa restrição; nenhuma contratação está aprovada.

Na rodada 2, o usuário confirmou que as operações de dados da aplicação passam pelo servidor Next.js, que acessa o Supabase com a identidade do usuário, mantendo RLS no PostgreSQL e sessão em cookies via `@supabase/ssr`. Usaremos a API REST gerada pelo Supabase; essa decisão não exige criar outra API REST no Next.js apenas para consumo interno. O acesso direto à API do Supabase continua sujeito a RLS e permissões SQL.
