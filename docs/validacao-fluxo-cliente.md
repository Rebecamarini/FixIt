# Integração do fluxo do Cliente — 2026-11-22

Implementação local do cartão **[FRONT] Integrar e testar fluxo do Cliente**. O conector Trello não está disponível nesta sessão e a abertura do board público falhou. Não foi possível confirmar o link do cartão, lista, atribuição, checklists ou comentários ao vivo; não houve atualização do cartão. Foram utilizados o pedido do usuário, os contratos vigentes e o contexto histórico de DEC-001/DEC-002 em `docs/references/`.

## Rotas e comportamento

| Rota | Resultado |
| --- | --- |
| `/` | Dashboard do Cliente com nome do perfil autenticado, indicadores do conjunto completo e cinco solicitações recentes. Gestor e Manutentor conservam os acessos às funções existentes. |
| `/conta/entrar` | Tela e Server Action existentes preservadas. |
| `/conta/cadastrar` | Tela e Server Action existentes preservadas. |
| `/solicitacoes/nova` | Formulário, categorias, validação, tentativa idempotente, descarte de preenchimento e seleção de solicitante pelo Gestor preservados. Cliente usa o layout compartilhado. Após confirmação, atualiza Dashboard/listagem e oferece acompanhamento por UUID. |
| `/solicitacoes` | Tabela real com paginação de vinte itens, busca por ID/assunto/localização/categoria e filtro de estado. Busca e filtros são aplicados ao conjunto completo, com parâmetros preservados na paginação. |
| `/solicitacoes/[id]` | Consulta existente com isolamento por solicitante, detalhes, campos complementares preenchidos e histórico cronológico. ID inválido, inexistente e de terceiro recebem a mesma página de ausência. |

`ClienteLayout` concentra Sidebar e Header e preserva o CSS responsivo da demonstração. `Cards`, `TabelaChamados`, `FormularioSolicitacao`, `useRequestForm`, `AccountForm` e `LogoutForm` foram reutilizados. O nome vem do perfil da sessão. Datas usam os timestamps reais, e links usam os UUIDs reais.

`src/server/client-view.ts` compõe os serviços existentes `listarSolicitacoes` e `obterSolicitacao`, sem substituir a implementação de domínio. A listagem percorre as páginas de resumos; os detalhes da página são consultados em lotes de até cinco. Busca textual também consulta os detalhes de todas as solicitações para preservar pesquisa por localização. Essa composição custa mais requisições conforme o volume cresce; busca e agregação no backend podem otimizar isso em entrega futura. Não foram alterados contratos para realizar esta integração.

Sem sessão, as quatro rotas protegidas do Cliente encaminham ao login. As consultas existentes continuam exigindo Cliente e filtrando por `solicitante_id`; nenhum controle de alteração de estado, prioridade, aprovação, descarte ou atribuição foi adicionado. Logout continua usando `sair`/`sairDaConta`. Não houve mudanças em `src/proxy.ts`, serviços de domínio existentes, migrations, banco, RLS, dependências ou recursos administrativos.

## Arquivos alterados

- `next-env.d.ts`
- `src/app/page.module.css`
- `src/app/page.tsx`
- `src/app/solicitacoes/nova/form.tsx`
- `src/app/solicitacoes/nova/page.module.css`
- `src/app/solicitacoes/nova/page.tsx`
- `src/app/solicitacoes/page.module.css`
- `src/app/solicitacoes/page.tsx`
- `src/components/cliente/Header.tsx`
- `src/components/cliente/Sidebar.tsx`
- `src/components/cliente/TabelaChamados.tsx`

## Arquivos adicionados

- `src/app/error.tsx`
- `src/app/loading.tsx`
- `src/app/solicitacoes/[id]/not-found.tsx`
- `src/app/solicitacoes/[id]/page.module.css`
- `src/app/solicitacoes/[id]/page.tsx`
- `src/components/cliente/ClienteLayout.module.css`
- `src/components/cliente/ClienteLayout.tsx`
- `src/components/cliente/Dashboard.tsx`
- `src/lib/client-requests.ts`
- `src/server/client-view.ts`
- `tests/client-requests.test.ts`
- `docs/validacao-fluxo-cliente.md` (este relatório)

## Arquivos demonstrativos removidos

A relação foi apresentada na conversa antes da remoção, depois da integração e da primeira compilação TypeScript. Layout e estilos foram migrados para os destinos reais acima, antes da exclusão das demos. O formulário ilustrativo foi substituído pelo formulário funcional existente. Dados fictícios e opções `demonstracao` dos componentes foram removidos.

Também foram verificados os arquivos do projeto Vite isolado `fixit-frontend/`: continham somente o template inicial com logos e contador, sem referências pela aplicação real ou funcionalidades do FixIt. Foram removidos seus arquivos versionados; dependências locais ignoradas pelo Git não foram apagadas. Testes, fixtures e scripts de preparação de ambiente foram preservados.

- `fixit-frontend/.gitignore`
- `fixit-frontend/.oxlintrc.json`
- `fixit-frontend/README.md`
- `fixit-frontend/index.html`
- `fixit-frontend/package-lock.json`
- `fixit-frontend/package.json`
- `fixit-frontend/public/favicon.svg`
- `fixit-frontend/public/icons.svg`
- `fixit-frontend/src/App.css`
- `fixit-frontend/src/App.jsx`
- `fixit-frontend/src/assets/hero.png`
- `fixit-frontend/src/assets/react.svg`
- `fixit-frontend/src/assets/vite.svg`
- `fixit-frontend/src/index.css`
- `fixit-frontend/src/main.jsx`
- `fixit-frontend/vite.config.js`
- `src/app/demo/cliente/dados.ts`
- `src/app/demo/cliente/page.module.css`
- `src/app/demo/cliente/page.tsx`
- `src/app/demo/cliente/solicitacoes/[id]/not-found.tsx`
- `src/app/demo/cliente/solicitacoes/[id]/page.module.css`
- `src/app/demo/cliente/solicitacoes/[id]/page.tsx`
- `src/app/demo/cliente/solicitacoes/lista-chamados.tsx`
- `src/app/demo/cliente/solicitacoes/page.module.css`
- `src/app/demo/cliente/solicitacoes/page.tsx`
- `src/app/demo/solicitacao/page.module.css`
- `src/app/demo/solicitacao/page.tsx`

## Verificação executada

Foi usada a instalação existente de **Node 24.18.0**, conforme `.nvmrc`. O Node 22 padrão do terminal não aceita `--test-isolation=none`; não foi necessário instalar pacotes ou mudar os scripts.

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | Passou. |
| `npm run lint` | Passou, sem avisos. |
| `npm run build` | Passou; seis rotas do Cliente presentes, nenhuma rota demo. |
| `npm test` | 16 testes passaram. Novos casos cobrem busca após o item vinte, acentos, caixa, localização, filtros combinados, ordem e vazio. |
| `npm run check:static` | Passou: lint, duplicação, dependências e código sem uso. |
| `git diff --check` | Passou. |
| Chrome headless, 1440×900 e 390×900 | Login e cadastro renderizados; largura do documento igual à viewport, sem transbordamento horizontal. |
| Navegação anônima no Chrome | `/`, `/solicitacoes`, `/solicitacoes/nova` e `/solicitacoes/[id]` chegaram a `/conta/entrar` nas duas larguras. |
| Links de conta e campos obrigatórios | Links login/cadastro apontam para as rotas reais; campos obrigatórios e botões presentes. Submissão vazia permaneceu no formulário, bloqueada pela validação nativa. |
| HTTP nas demos | `/demo/cliente`, `/demo/cliente/solicitacoes` e `/demo/solicitacao` retornaram 404. |
| Busca por referências demo em `src` | Nenhum link `/demo/`, opção `demonstracao` ou dado de Ana Souza remanescente. |

Com streaming e `loading.tsx`, os redirecionamentos anônimos podem começar com HTTP 200 e meta refresh; o destino final foi confirmado no navegador, e não inferido apenas pelo código HTTP.

## Dependências e limites da validação

**Não foi validado o fluxo autenticado de ponta a ponta.** `npm run check:connection` informou Supabase local indisponível ou chave recusada; `docker info` confirmou ausência do socket do daemon. A existência de `.env.local` não comprova um backend funcional. Não foram executados testes de integração contra banco nem alterado o ambiente cloud.

Continuam pendentes, com Auth/Supabase funcionais: cadastrar e autenticar uma conta; abrir/reenviar uma solicitação; conferir Dashboard e listagem após o envio; navegar pelos detalhes e histórico persistidos; verificar isolamento entre dois Clientes; verificar proibições de escrita e permissões de Gestor/Manutentor; encerrar a sessão e confirmar bloqueio posterior; simular falhas/latência; revisar desktop/celular das telas autenticadas com dados reais. Estados vazios e filtros foram testados em funções puras e revisados no código, sem afirmar validação autenticada no navegador.

O contrato de solicitações atual só admite **Pendente**. Prioridade, atribuição de Manutentor, vínculo formal com inventário e transições para Aprovada/Em atendimento/Concluída/Descartada ainda dependem de implementação do backend. Esses campos aparecem como indisponíveis, e não como valores fictícios ou como confirmação de ausência de atribuição. Os indicadores leem os estados retornados; com o contrato atual os indicadores de atendimento e conclusão permanecem zero.

Observações são os campos complementares reais da solicitação e as descrições reais dos eventos. Não há serviço separado de comentários nesta entrega. O histórico exibe o nome do usuário atual quando ele é o autor e o UUID real para outros autores, pois o contrato não retorna seus nomes. Categoria é consultada com a sessão e possui mensagem de falha própria.

As telas de conta existentes não foram ampliadas com matrícula/setor: continuam conforme o contrato implementado, sem mudar regras de cadastro neste cartão. O aceite integrado do cartão permanece pendente da validação autenticada e das entregas de backend descritas acima. A publicação de commit e pull request foi autorizada pelo usuário após esta validação; o aceite integrado continua pendente.
