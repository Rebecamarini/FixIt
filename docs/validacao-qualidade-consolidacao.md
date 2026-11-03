# Qualidade da consolidação — validação local

Implementação da [spec no Trello](https://trello.com/c/hRLkCOuP), em
2026-11-02, na branch local `refactor/qualidade-consolidacao`, sobre
`8cdf78341644be0436e4c2ebdf54a0655cb8eaeb` e o trabalho ainda sem commit da
branch `fix/us-003-perfil-http-429`.

## Resultado e escopo

Os bloqueios estáticos foram corrigidos sem mudar limites, supressões,
exclusões, dependências, lockfile, migrations ou políticas de autorização.
Foram separadas responsabilidades existentes de validação, classificação de
erros e apresentação nos módulos de contas, identidade, perfil e solicitações.
O formulário de solicitação separa preenchimento, categorias, busca, envio e
descarte em hooks locais; a tentativa idempotente permanece no mesmo ciclo de
vida do formulário.

O helper `contaAtivaParaSolicitacao` foi removido após confirmar ausência de
consumidores no código, testes e scripts. A revalidação do solicitante ativo
na operação SQL de envio permanece. `CampoSolicitacao`, antes apontado como
export sem uso, agora tem consumidor real no componente de campo extraído.
O tipo compartilhado `Papel` foi preservado.

A correção HTTP 429 preexistente foi usada como ponto de partida. A página e
o painel de perfil continuam idênticos ao início desta tarefa; as extrações
no modal e no servidor preservam os resultados parciais e a repetição apenas
do encerramento de sessões. Os testes e documentos anteriores foram mantidos.

## Verificações

| Verificação | Resultado |
| --- | --- |
| ESLint antes da refatoração | 22 erros em 12 arquivos, reproduzidos da cópia inicial com a configuração vigente |
| `npm run check:static` | Aprovado, incluindo todos os quatro controles |
| ESLint final | Zero erros e avisos |
| jscpd | Zero clones, 0% de duplicidade |
| dependency-cruiser | Zero violações; 51 módulos e 142 dependências |
| Knip | Zero achados |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado |
| `npm test` | 13 aprovados, zero falhas e skips |
| `npm run test:integration` | 41 aprovados, zero falhas e skips |
| `git diff --check` | Aprovado |

Os [logs desta execução](evidencias/qualidade-consolidacao/logs/) incluem a
reprodução dos 22 erros iniciais. Essa reprodução leu o conteúdo preservado
antes das edições usando ESLint e os caminhos originais, sem restaurar arquivos
por cima do trabalho atual. Não foi criado baseline de tolerância.

As integrações executaram todos os arquivos configurados, com Auth, Data API e
PostgreSQL locais reais. Incluem papéis e renovação de sessão; isolamento;
criação, exclusão e concorrência de contas; finalização e remoção Auth com
resultado incerto; e-mail, senha e resultado parcial; HTTP 429; solicitante e
autor; rollback real do histórico; concorrência com exclusão e reenvio único.
As mensagens `refresh_token_not_found` no log pertencem ao ensaio de revogação
de sessões e não representam falha da suíte.

## Conferência de interface

Conferência prática em Chromium contra o build de produção local. Os roteiros
anteriores foram executados novamente, em cópias temporárias fora do repositório,
com evidências novas. Não foi acrescentada suíte permanente de navegador.

- **Perfil:** 60 cenários, nos três papéis e nas larguras 390 e 1440 px.
  Abertura sob 429; nome/e-mail preservados e senhas limpas após erro;
  troca de senha com encerramento pendente; repetição limitada e bem-sucedida;
  gravações reais de nome/e-mail e recarga confirmando persistência. Sem erros
  JavaScript ou transbordamento horizontal. [Resultados](evidencias/qualidade-consolidacao/perfil/resultados.json).
- **Contas:** roteiro US-004 reexecutado em 390 e 1440 px, incluindo acessos
  recusados, cadastro Cliente, criação pelo Gestor, preservação após erro,
  limpeza de senha, conta própria sem exclusão, cancelamento, exclusão com
  Tab/Shift+Tab/Escape/Enter e reutilização do e-mail com nova identidade.
  Sem erros JavaScript ou transbordamento horizontal.
- **Solicitações:** roteiro US-009 reexecutado em celular e computador:
  envio pelos três papéis, foco no primeiro erro, resposta perdida após gravação
  real, campos preservados e bloqueados, reenvio sem duplicidade, novo pedido,
  representação de cada papel, categoria removida, solicitante excluído,
  aviso nativo ao sair e diálogo de descarte sob resultado incerto, sessão
  perdida e recuperação com a identidade original. Cada execução conferiu
  dez solicitações e exatamente um evento inicial por solicitação, incluindo
  autoria, data e normalização. Sem erros JavaScript.
- **Lista e teclado:** oito grupos adicionais aprovados: lista do Cliente
  em 390/1440 px e modais dos três papéis nas duas larguras. Conferidos vazio,
  paginação 20+1, página sem itens, retorno e ausência de resumos alheios;
  Tab/Shift+Tab circular, Escape, confirmação de descarte e foco devolvido ao
  botão de abertura; preservação de valores e limpeza de senhas após erro.
  Zero erros JavaScript ou transbordamento. [Resultados e imagens](evidencias/qualidade-consolidacao/lista-teclado/resultados.json).
  A rota de detalhe não existe nesta base; o retorno 404 não substitui a
  comprovação de isolamento das consultas feita pela suíte de integração.

Imagens novas de [contas](evidencias/qualidade-consolidacao/contas/) e
[perfil](evidencias/qualidade-consolidacao/perfil/) ficam junto aos logs.

## Revisão e ambiente

Revisão pela skill `code-review`, com eixos Standards e Spec em subagentes:
zero achados introduzidos em ambos. O ponto de comparação foi a cópia do
`src` anterior a esta tarefa, incluindo a correção HTTP 429 ainda sem commit,
para distinguir trabalho anterior da refatoração.

Node 24.18.0 e npm 11.16.0, instalação por `npm ci`, CLI Supabase 2.121.0 e
Next.js 16.4.2. Guias instaladas de fronteira cliente/servidor foram lidas antes
das edições. A VM Colima dedicada `fixit-validation` foi reiniciada, com
`DOCKER_HOST` explícito e Supabase restaurado dos dados locais preservados.
O contexto Docker padrão não foi alterado. A preparação de dados fictícios
existente foi repetida somente na stack local.

O teste existente que invoca `sg docker -c` recebeu o mesmo adaptador temporário
macOS usado na validação anterior: executa o comando sem troca de grupo.
O ensaio real de rollback permaneceu na execução completa. A simulação de
HTTP 429 ocorreu apenas na fronteira HTTP do servidor local por instrumentação
externa ao repositório; o sucesso usou Auth e banco reais.
Servidor, stack Supabase e VM dedicada foram encerrados ao finalizar,
preservando os dados locais.

## Entrega e limites

Alterações locais para revisão; nenhum commit, push, PR, merge, deploy ou
operação cloud. O fluxo da skill `implement-spec` foi adaptado para trabalho
compartilhado na branch local, respeitando a proibição expressa de commits e
merges. Não foram criadas worktrees auxiliares.

O cartão não tinha tickets associados, checklists nem responsável. Sua lista
e atribuição foram preservadas como a spec exige. Esta entrega não representa
aceite humano, integração na main, promoção cloud ou conclusão automática das
histórias relacionadas. O diff está disponível no checkout; inclui também o
trabalho HTTP 429 anterior, identificado acima.
