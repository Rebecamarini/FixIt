# Criação da solicitação — BT-004

[SPEC-001](https://trello.com/c/vWo76DXs) · [BT-004](https://trello.com/c/MrgSRKFE).
Base para S1-P01; formulário, anexos e transições administrativas ficam nas histórias.
A [identidade compartilhada](contratos-identidade.md) continua sendo a fonte da sessão.

`criarSolicitacao(client, input)` em `src/server/requests.ts` recebe um cliente
Supabase autenticado por requisição e um objeto desconhecido na fronteira.
Server Actions/Route Handlers obtêm esse cliente com `createSessionClient()`;
a operação usa `obterIdentidade(client)` e a identidade real do Auth, sem chave
administrativa. Somente Cliente pode criar. Não existe RPC privilegiado público.

| Campo de entrada | Tipo | Nulabilidade e validação |
| --- | --- | --- |
| `local` | texto | Obrigatório, não vazio após trim; local livre |
| `categoria_id` | UUID em texto | Obrigatório; referência existente em `categorias` |
| `assunto` | texto | Obrigatório, não vazio após trim |
| `descricao` | texto | Obrigatório, não vazio após trim |
| `motivo` | texto | Opcional, ausente/null/branco vira null |
| `pessoas_areas_afetadas` | texto | Opcional, ausente/null/branco vira null |
| `frequencia` | texto | Opcional, ausente/null/branco vira null |
| `tipo_utilizacao` | texto | Opcional, ausente/null/branco vira null |
| `riscos` | texto | Opcional, ausente/null/branco vira null |
| `patrimonios_afetados` | texto | Opcional, descrição livre; não vincula inventário |

Textos são aparados nas pontas; espaços internos são preservados. Não há tamanho
máximo ou formato institucional arbitrário nesta preparação. Valores não textuais
e propriedades desconhecidas são recusados, inclusive autoria, estado, datas,
prioridade, setor responsável e Manutentor. O banco também recusa nulos e textos
obrigatórios vazios/somente espaços, tabulações, quebras de linha e BOM na API direta.
A normalização dos textos opcionais é contrato da operação do servidor; a API
direta pode armazenar textos opcionais sem trim.

`solicitacoes` contém os campos acima e:

| Campo de saída | Tipo SQL / TypeScript | Regra |
| --- | --- | --- |
| `id` | uuid / string | PK, gerado pelo banco, não nulo |
| `autor_id` | uuid / string | FK perfis, `auth.uid()`, não nulo |
| `criado_em` | timestamptz / string ISO | `now()` do banco, não nulo |
| `estado` | text / `"Pendente"` | Default e constraint, não nulo |

Resposta: `{ data: Solicitacao, erro: null }` em sucesso; em falha,
`{ data: null, erro }`. Códigos estáveis: `nao_autenticado` (sem sessão/perfil),
`nao_autorizado` (papel diferente de Cliente), `dados_invalidos` (entrada ou
constraint/FK recusada) e `falha_persistencia` (demais falhas da API). Uma falha
na verificação do perfil lança o erro sanitizado documentado em identidade.
Não apresentar mensagens internas do PostgreSQL nem credenciais ao usuário.

```ts
const client = await createSessionClient();
const resultado = await criarSolicitacao(client, {
  local: "Sala 12",
  categoria_id: "20000000-0000-4000-8000-000000000001",
  assunto: "Lâmpada apagada",
  descricao: "A lâmpada não acende.",
  riscos: "Sala escura",
});
// resultado.data: { id: UUID, autor_id: UUID da sessão, criado_em: ISO,
// estado: "Pendente", ...campos, opcionais ausentes: null }
```

Categorias fictícias reproduzíveis pela migration: Elétrica
(`20000000-0000-4000-8000-000000000001`) e Hidráulica
(`20000000-0000-4000-8000-000000000002`). Anon/autenticado podem consultar;
nenhum deles modifica referências.

`historico_solicitacoes` registra `id uuid PK`, `solicitacao_id uuid FK`,
`autor_id uuid FK perfis`, `criado_em timestamptz`, `descricao text`,
`estado_anterior text nullable`, `estado_novo text`. Todos os demais campos são
não nulos. Na criação, o evento possui o mesmo autor e instante da solicitação,
descrição `Solicitação criada.`, estado novo `Pendente`, estado anterior `null`.
O trigger AFTER INSERT grava esse evento na transação original: falha no evento
impede a solicitação. Não existe escrita de histórico pela operação do servidor
nem pelo Cliente. Histórico é somente leitura e herda a visibilidade da solicitação.

O trigger privado usa `SECURITY DEFINER` com `search_path` fixo/vazio para gravar
histórico protegido; verifica `auth.uid()` contra a autoria e não concede EXECUTE
a PUBLIC/anon/authenticated/service_role. INSERT da solicitação é permitido
somente nas colunas editáveis; mesmo reenviar o próprio autor ou o estado correto
é proibido na API direta. RLS limita criação/leitura ao Cliente proprietário.
Nenhum UPDATE/DELETE é concedido e os papéis Gestor/Manutentor não antecipam
acesso administrativo. Tabelas expostas têm grants explícitos e RLS na migration.

`npm run test:integration` comprova persistência por sessão real, contrato e
ataques diretos. O teste de atomicidade instala uma constraint temporária local
que recusa apenas o autor de teste no histórico, observa ausência do registro
pai pela API e remove a constraint em `finally`. A proteção de alvo local roda
antes desse SQL; não existe failpoint em código/migration de produção.
Dados reproduzíveis para consulta e paginação pertencem à BT-005.

## Consulta própria — BT-005

[BT-005](https://trello.com/c/m7H2NRnJ) prepara os contratos para Rebeca em
[S1-R01](https://trello.com/c/OaAB6z5B), sem entregar as telas de US-005/010/011.
As funções abaixo são exportadas pelo mesmo `src/server/requests.ts`, recebem
`createSessionClient()` no servidor e usam a identidade real da requisição.
Nenhuma consulta usa chave administrativa. Gestor/Manutentor não recebem
visibilidade administrativa nesta base.

`listarSolicitacoes(client, pagina = 1)` recebe página numérica inteira, começando
em **1**, com **20** itens fixos. Strings, null, frações, zero e negativos são
inválidos; limite de página `107374182` mantém o intervalo dentro do inteiro da
API. Ordenação: `criado_em DESC, id DESC` (UUID desempata instantes iguais).
Cada `ResumoSolicitacao` contém apenas `id`, `assunto`, `categoria_id`,
`criado_em` e `estado`, com os mesmos tipos não nulos da solicitação. A categoria
pode ser resolvida nas referências compartilhadas, sem copiar o nome para a
solicitação. `total` conta somente o conjunto autorizado; não inclui outro Cliente.

```ts
const client = await createSessionClient();
await listarSolicitacoes(client, 1);
// { data: { itens: [{ id: UUID, assunto: "Lâmpada apagada",
//   categoria_id: UUID, criado_em: ISO, estado: "Pendente" }, ...],
//   pagina: 1, tamanho_pagina: 20, total: 21 }, erro: null }
await listarSolicitacoes(client, 2);
// { data: { itens: [/* último resumo */], pagina: 2,
//   tamanho_pagina: 20, total: 21 }, erro: null }
await listarSolicitacoes(client, 3);
// { data: { itens: [], pagina: 3, tamanho_pagina: 20, total: 21 }, erro: null }
// Cliente sem solicitações: itens: [], pagina: 1, tamanho_pagina: 20, total: 0.
```

Paginação por deslocamento: envios concorrentes podem deslocar itens entre
consultas de páginas; a ordenação determinística vale para o conjunto estável,
sem prometer snapshot entre requisições. Página além do total também é sucesso
vazio; a operação trata o intervalo fora do conjunto retornado pela API.

`obterSolicitacao(client, id)` retorna `{ data: Solicitacao, erro: null }`, com
todos os campos documentados acima, incluindo textos opcionais null. UUID válido
inexistente e UUID de outro Cliente retornam exatamente
`{ data: null, erro: "nao_encontrado" }`, sem confirmar existência.

`obterHistoricoSolicitacao(client, id)` verifica a mesma solicitação protegida e
retorna `{ data: EventoSolicitacao[], erro: null }`, ordenado por
`criado_em ASC, id ASC`. Cada evento possui os campos/tipos da tabela de histórico
documentados acima. A criação produz um evento; estado anterior é null.
Histórico de UUID inexistente/alheio recebe a mesma resposta `nao_encontrado` do
detalhe, em vez de confundir ausência com um histórico permitido vazio. Não há
função de escrita; API também recusa INSERT/UPDATE/DELETE do Cliente.

Todas as consultas retornam `{ data: null, erro }` em falha. Códigos:
`nao_autenticado` (sem sessão/perfil), `nao_autorizado` (papel diferente de Cliente),
`dados_invalidos` (página ou UUID inválido), `nao_encontrado` (detalhe/histórico
fora do conjunto próprio), `falha_consulta` (demais erros da API). Falha de
verificação de perfil continua lançando o erro sanitizado de identidade.
Sem sessão, a API direta não concede SELECT; outra sessão Cliente recebe
lista vazia para o UUID alheio. O contrato normaliza essa ausência no servidor.

### Exemplos reproduzíveis e roteiro local

Execute `npm run prepare:test-data` após as migrations locais. Além das quatro
contas do [contrato de identidade](contratos-identidade.md), a rotina prepara
**21 solicitações e 21 eventos por Cliente**. Usa `criarSolicitacao` com sessão
real de cada conta; autoria, data, UUID e estado continuam vindo do banco.
Assuntos estáveis: `SPEC-001 exemplo 0001-01` a `0001-21`, e `0002-01` a
`0002-21`. Categoria Elétrica, locais `Sala fictícia 1` a `Sala fictícia 21`.
Datas e UUIDs são gerados na primeira execução, preservados nas seguintes.

Repita o comando para verificar idempotência: contas/senhas, solicitações e eventos
existentes não são alterados. Um assunto reservado duplicado, conteúdo divergente
ou histórico alterado interrompe a carga com diagnóstico de colisão, preservando
os registros. Solicitações adicionais dos usuários ficam intactas. Execute uma
rotina por vez; esta carga manual não coordena execuções concorrentes.

Entre com cada Cliente pelas credenciais fictícias locais documentadas, chame
listagem (páginas 1, 2 e 3), abra um UUID próprio e tente um da outra conta.
Execute `npm run test:integration` para verificar também vazio, empate de datas,
cronologia, ausência uniforme e ataques de escrita. Os dados cronológicos extras
dos testes são sintéticos, locais e limpos; não implementam transições de estado.
O cloud usa os mesmos guards explícitos de alvo/senha/chave administrativa e
confirmação do contrato de identidade, somente após promoção aprovada das
migrations. A preparação permanece separada do CD; BT-005 não executa carga cloud.

Verificado localmente em 2026-10-18: `sg docker -c 'npm run verify'` aprovou
lint, tipos, build, 5 verificações de configuração e 13 integrações reais. As
3 integrações de consulta cobrem paginação/empates, privacidade/cronologia e
repetição da carga comparando contas, solicitações e eventos antes/depois,
incluindo uma solicitação adicional preservada. O banco local permanece com
os 42 exemplos e seus eventos; testes removem apenas seus registros temporários.
