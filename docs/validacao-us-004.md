# Validação da US-004 — Gerenciar contas de usuário

[US-004 no Trello](https://trello.com/c/waxQ1rjj), validada localmente em
2026-10-26. O cartão foi lido integralmente, com DEC-001 e DEC-002: estava no
Backlog do Produto, sem responsável. A spec e o ADR 0005 prevalecem sobre os
requisitos históricos de troca de papel, matrícula e setor pessoal.

## Entrega

- Gestor acessa `/usuarios` pela inicial, consulta contas ativas, busca por
  nome/e-mail, filtra papel e navega em ordem alfabética, com páginas de 20.
- Gestor cria Manutentor/Gestor com nome, e-mail e senha inicial. O servidor
  reserva o perfil com papel definitivo antes de criar o Auth com o mesmo UUID;
  uma revalidação do Gestor libera a conta. A sessão do Gestor é preservada.
- O papel é imutável no banco. Autocadastro cria Cliente. Cadastro e perfil
  deixam de pedir matrícula e setor; valores legados e setores de atendimento
  permanecem no banco, com identidades e vínculos existentes preservados.
- Exclusão usa diálogo com título acessível, identificação da conta,
  consequências, confirmação e cancelamento. Não oferece autoexclusão.
- A operação SQL serializa exclusões, revalida o autor e grava alvo/autor/data
  em auditoria imutável. O perfil histórico permanece; a remoção no Auth libera
  o e-mail. RLS bloqueia consultas e ações com JWTs emitidos anteriormente.
- Um recadastro recebe UUID novo e papel Cliente, sem herdar solicitações.
  A consulta de contas excluídas [continua como entrega futura](https://trello.com/c/KHRLMHXm).

As operações de gestão usam uma capacidade administrativa própria, somente no
servidor, documentada no [contrato de identidade](contratos-identidade.md).
A exceção do ADR 0004 continua restrita à troca do próprio e-mail.

## Evidências de integração

Auth, PostgreSQL e Data API reais no Supabase local; cookies SSR e credenciais
reais nos caminhos de sucesso. Falhas controladas são inseridas apenas na
fronteira HTTP para exercitar indisponibilidade e resultados desconhecidos.

| Comportamento | Evidência |
| --- | --- |
| Listagem e criação | Busca por nome/e-mail, filtro, ordenação, 20+1 resultados; papel inicial correto; sessão do Gestor preservada. |
| Permissões | Visitante, Cliente e Manutentor recusados; RPCs administrativas sem EXECUTE público; papel, matrícula e setor pessoal protegidos contra escrita direta. |
| Perfil e credenciais | Os três papéis salvam somente nome; trocas independentes de e-mail/senha e isolamento entre usuários continuam cobertos. |
| Identidade histórica | Conta excluída com solicitação/evento mantém os mesmos UUIDs, autoria e estado Pendente. Auditoria não aceita UPDATE ou DELETE. |
| Bloqueio e recadastro | Sessão anterior perde acesso na próxima consulta; Data API com JWT anterior não devolve solicitações; e-mail liberado recebe outra identidade Cliente sem herança. |
| Concorrência | Duas exclusões do mesmo alvo produzem um evento; exclusões mútuas têm um vencedor, com Gestor ativo remanescente. Autoexclusão é recusada. |
| Falha parcial de exclusão | Uma falha na remoção Auth não informa sucesso completo; repetir termina a remoção e mantém um único evento. |
| Resultado de criação desconhecido | Perfil pendente mantém o papel definitivo e não tem acesso/listagem. “Conferir criação” repete a finalização sem senha, com autorização atual, de forma idempotente. |
| Indisponibilidade | Falha ao verificar a sessão recebe orientação de tentar novamente e não vira falta de permissão. Respostas não expõem senha ou detalhes do provedor. |

Os registros fictícios de exclusão permanecem com identidade/auditoria por serem
imutáveis. A limpeza de fixtures retira o acesso dos autores temporários sem
apagar esses registros históricos.

## Navegador

O roteiro [tests/browser/us004.mjs](../tests/browser/us004.mjs) passou em
**390 px e 1440 px**, usando Playwright instalado fora do projeto. Não foi
acrescentada dependência. Foram verificados:

- navegação e acesso direto por papel; cabeçalhos `private, no-store`;
- ausência de matrícula/setor em cadastro e perfil;
- cancelamento de criação sem conta nova;
- erros de campos e e-mail ocupado, preservando nome/e-mail/papel e limpando senha;
- criação e primeiro login com papel correto, mantendo o Gestor conectado;
- conta própria sem excluir; diálogo com foco inicial em Cancelar, Tab,
  Shift+Tab, Escape e confirmação por Enter;
- cancelamento sem auditoria, exclusão com confirmação persistente após esvaziar
  a busca e recadastro pelo mesmo e-mail como Cliente;
- ausência de erros JavaScript e de rolagem horizontal do documento. A tabela
  tem rolagem própria em telas estreitas, preservando a legibilidade das colunas.

Capturas em [evidencias/us-004](evidencias/us-004/). A inspeção visual confirmou
legibilidade do diálogo mobile e dos títulos da tabela desktop. A recuperação
por “Conferir criação” foi comprovada na integração; a falha de infraestrutura
não foi reproduzida no navegador.

Para repetir com a instalação externa usada nesta validação, inicie a aplicação
na porta 3100 e execute:

```sh
LD_LIBRARY_PATH=/tmp/dea-blog-playwright/libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/dea-blog-playwright \
PLAYWRIGHT_MODULE=/home/joao_ricardo/DEA-blog/node_modules/playwright/index.mjs \
node tests/browser/us004.mjs
```

## Revisão e operação

`npm run verify` passou com lint, tipos, build, **7 testes unitários e 37 testes
de integração**, sem falhas. Após os últimos ajustes de apresentação e mensagem
de indisponibilidade, lint/tipos/build e a integração específica de criação
de Manutentor/Gestor também passaram. O roteiro de navegador passou nas duas
larguras, sem erros JavaScript. `git diff --check` não encontrou problemas.

A skill `code-review` revisou padrões e spec em agentes separados, comparando
as alterações locais com HEAD. O achado de documentação sobre provisionamento
foi corrigido. Quatro achados da spec foram corrigidos e reavaliados: recuperação
da criação pendente, distinção de indisponibilidade, preservação do papel e
limpeza de senha em erros de validação. **Nenhum achado aberto nas duas revisões.**

A migration nova foi aplicada ao banco local existente sem reset. As iterações
locais foram consolidadas em um único arquivo e o histórico local reconciliado.
A CLI reconstruiu todas as migrations em banco temporário para comparar os
schemas `public` e `private`: nenhuma diferença encontrada. Os advisors de
segurança não apontaram problemas.

Foram consultados os guias do Next.js instalado e a documentação atual do
Supabase sobre [criação administrativa](https://supabase.com/docs/reference/javascript/auth-admin-createuser),
[remoção administrativa](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
e [dados de usuário e JWTs](https://supabase.com/docs/guides/auth/managing-user-data).
O changelog foi conferido para as mudanças relevantes de banco e grants.

Nenhuma configuração, migration ou conta cloud foi alterada. O ambiente de
destino precisará receber a migration e `SUPABASE_SECRET_KEY` no runtime do
servidor pelo fluxo de integração existente. Uma indisponibilidade prolongada
antes da criação Auth pode manter uma reserva pendente; o fluxo orienta conferir
novamente ou procurar o responsável, sem liberar acesso nem afirmar sucesso.

As alterações preexistentes em `.gitignore`, `AGENTS.md`, `GLOSSARY.md`,
`docs/references/README.md`, ADR 0005, specs e métricas foram preservadas.
Tudo permanece local, sem commit, push, PR ou publicação.
