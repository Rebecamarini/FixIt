# Validação local — US-026

Data: 2026-11-07. Cartão: [US-026](https://trello.com/c/9GuoxjTU). Contrato: [spec](specs/us-026-consultar-bens-patrimoniais.md).

## Escopo entregue

Consulta de bens ativos para Gestor/Manutentor, pesquisa parcial literal por código, páginas de 10 e detalhes dos dados atuais. Busca/página permanecem na URL e na volta dos detalhes. Arquivados não são consultáveis; conservação Péssimo não exclui um bem ativo. Cliente, visitante e contas sem autorização não recebem inventário. Edição, arquivamento, vínculos e histórico permanecem nas histórias futuras.

Migration nova concede leitura de colunas específicas com RLS por papel/conta válida e condição ativa. A RPC de lista é SECURITY INVOKER; não usa credencial administrativa. Escrita e campos internos de autoria/tentativa permanecem protegidos. Migrations anteriores e cadastro US-025 foram preservados.

## Ambiente e integração

Base: main b8a1d3578671fb3ea74f70fd0d34ecd2a920c0a0. Branch local: integration/us-026. Implementador em worktree própria e integração por cópia verificada dos arquivos, respeitando a proibição de commits sem autorização expressa. Alterações anteriores do usuário preservadas.

Node 24.18.0 e npm 11.16.0; Supabase CLI 2.121.0. Stack Supabase local existente pelo contexto Docker colima-fixit-validation. Migration 20261107182858 criada via CLI, iterada por SQL local, aplicada e registrada no histórico local; dez migrations conferidas. Nenhuma operação cloud.

## Evidências

- TDD: teste da consulta pública inicialmente falhou por interface ausente; passou após implementar a leitura autorizada. Teste seguinte de busca/paginação passou após completar a normalização literal também na RPC.
- Integração completa: 48/48 aprovados, sem skips, incluindo três novos testes de consulta patrimonial e as quatro integrações existentes da US-025.
- Unitários: 13/13 aprovados, sem skips.
- Qualidade estática: lint, duplicação, dependências e código não usado aprovados. Complexidade e exportação sem uso detectadas na primeira rodada foram corrigidas antes do resultado final.
- Tipos aprovados. Build de produção webpack aprovado na worktree; esse compilador foi usado porque o Turbopack não aceita o symlink de dependências fora da raiz da worktree. Após integração dos arquivos, `npm run build` padrão com Turbopack também aprovado na workspace principal, incluindo as rotas de lista e detalhes.
- Navegador real: entrada dos papéis autorizados, recusa de Cliente/visitante, páginas de 10, pesquisa/Enter, detalhes/volta, recarga da URL, símbolos literais e falha real de leitura SQL seguida de recuperação. Fixtures descartáveis e falha temporária foram removidas ao terminar.
- Layout móvel conferido visualmente em captura de 390 px, sem overflow horizontal.
- Advisors de segurança do banco local: nenhum problema encontrado.
- Revisão independente: Standards sem achados; Spec sem achados. Revisores inspecionaram código e testes sem alterar banco.

Os testes de integração cobrem dados de outros autores, todas as conservações, desempate numérico inclusive códigos com sete dígitos, opcionais ausentes, arquivados ocultos, pesquisa literal/trim, páginas fora do intervalo, contas excluídas/provisionamento pendente, sessão encerrada, acesso direto ao banco e proteção de escrita/campos internos.

## Reprodução

Com runtime fixado, configuração local válida e Docker acessível, aplicar as migrations somente ao banco local e executar:

```sh
npm run check:static
npm run typecheck
npm run build
npm test
npm run test:integration
```

Com aplicação local em execução e Playwright disponível, executar o script de navegador US-026 usando FIXIT_BROWSER_URL, PLAYWRIGHT_MODULE e PLAYWRIGHT_CHANNEL conforme o ambiente. O script valida destino local antes de preparar fixtures e remove seus dados ao terminar.

## Limites

As evidências acima são da implementação e validação locais, anteriores à publicação. Em pedido posterior, o usuário autorizou abrir o PR da US-026; o link, SHA publicado e estado do CI são acompanhados no cartão. Merge, promoção cloud e aceite humano permanecem pendentes. O cartão não deve ser concluído somente pelos resultados locais ou pela abertura do PR.
