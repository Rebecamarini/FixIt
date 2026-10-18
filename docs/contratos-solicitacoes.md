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
