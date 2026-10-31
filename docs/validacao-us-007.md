# Validação local da US-007 — Detalhar solicitação

Implementação local da [spec](specs/us-007-detalhar-solicitacao.md) e dos tickets
[T1 — Preencher e validar em nome próprio](https://trello.com/c/zXu4GaH1),
[T2 — Gestor selecionar outro solicitante](https://trello.com/c/V9fnXDJg) e
[T3 — Proteger preenchimento ao desistir ou sair](https://trello.com/c/JDczewAX).
As alterações preexistentes foram preservadas. Commit, push e abertura do PR
foram autorizados posteriormente pelo usuário para publicar esta entrega.

## Entrega

A página protegida existente permite preencher, revisar e validar os dados de
manutenção nos três papéis. A validação no servidor confere categoria e conta
ativa selecionada, normaliza textos e retorna erros sem executar gravação.
Gestor reutiliza a consulta autorizada de contas da US-004, com busca por nome ou
e-mail e páginas de 20. Cliente e Manutentor permanecem em nome próprio.

Há confirmação acessível de desistência, comparação com o preenchimento inicial
e aviso nativo de recarga/fechamento. Navegação pelo histórico usa cancelamento
do evento `navigate` quando disponibilizado pelo navegador, sem modificar ou
reconstruir entradas do histórico. O suporte a avisos de saída depende do navegador.
Não há persistência de rascunho nem envio: a gravação continua na US-009.

## Verificações

- `npm run verify`: lint, typecheck e build aprovados; 7 testes unitários e
  37 testes de integração aprovados, sem testes ignorados.
- `tests/browser/us007.mjs`, com Playwright externo, aplicação de produção local
  (`next start`) e Supabase local real: aprovado, sem erros JavaScript.
- Regressão `tests/browser/us006.mjs`: aprovada em produção nos três papéis,
  em 390 e 1440 px, com sessão inválida/não renovável, acesso direto, cache,
  logout e histórico; sem erros JavaScript nem novas solicitações/eventos.
- Cliente, Manutentor e Gestor: obrigatórios vazios/somente espaços, erros e foco,
  correção, normalização de pontas sem apagar espaços internos, opcionais em
  branco, indicação de validade removida após alteração, continuidade e descarte.
- Gestor: seleção explícita, busca por nome/e-mail, homônimos, três papéis,
  ordenação, 20+1 resultados, página seguinte e busca vazia; conta excluída após
  seleção e recadastro com o mesmo e-mail exigem nova escolha de identidade.
- Chamadas diretas à ação de busca: visitante, Cliente e Manutentor recusados.
- Falhas controladas de transporte nas consultas de categorias/contas, nova
  tentativa sem perder campos e resposta controlada sem categorias. Os sucessos
  de consulta, autenticação e seleção usam infraestrutura real.
- Desistência com dados, continuidade, descarte, reabertura sem recuperar dados,
  reversão completa e busca sem seleção; Back, Forward, salto de três entradas e
  aviso nativo de recarga conferidos no Chromium instalado.
- Formulário sem campos administrativos ou data/hora editável; operação por
  teclado, diálogo nativo, foco e largura de celular/computador verificados.

Prova de ausência de escrita na rodada de navegador de produção:

| Tabela | Antes | Depois |
| --- | ---: | ---: |
| solicitacoes | 49 | 49 |
| historico_solicitacoes | 49 | 49 |

As contas temporárias de teste são removidas no encerramento. Não executar testes
de integração que criam solicitações simultaneamente com essa comparação.

## Revisão

Revisão paralela por Standards e Spec, sobre as alterações locais relativas a
HEAD. Sem violação documentada de padrões. O tipo de papel foi alinhado ao domínio.
A revisão identificou uma suposição incorreta sobre direção/distância no histórico;
a versão final cancela o evento de travessia antes da mudança de URL e passou
pelos cenários de Back, Forward e múltiplas entradas. A revisão da correção não
apontou outro problema concreto. A pequena duplicação entre consulta inicial de
categorias (com limpeza de efeito) e nova tentativa foi mantida.

## Reprodução

Preparar o Supabase local e as contas fictícias conforme
[desenvolvimento local](desenvolvimento-local.md). Após `npm run verify`, iniciar
`npm run start -- --port 3101` e executar:

```bash
FIXIT_BROWSER_URL=http://127.0.0.1:3101 \
PLAYWRIGHT_MODULE=/caminho/externo/playwright/index.mjs \
node --conditions=react-server tests/browser/us007.mjs
```

Playwright e bibliotecas do Chromium usados nos testes são externos ao projeto;
nenhuma dependência foi adicionada. Usar build de produção evita o erro conhecido
de `Performance.measure` na instrumentação de desenvolvimento do Next/React,
também registrado na [validação da US-006](validacao-us-006.md).
