# Validação local da US-006 — Abertura e cancelamento

[Spec aprovada](specs/us-006-criar-solicitacao.md) · [Cartão no Trello](https://trello.com/c/3ouBfqLb).

Implementação local em 2026-10-24 na branch `feat/us-006-criar-solicitacao`,
baseada em `1bec0c0e91775b13b8e569ef8d49799d930921b0`. Commit, push e abertura
de PR autorizados posteriormente pelo usuário para publicar esta entrega.
As alterações de documentação que já estavam no diretório foram preservadas.

## Escopo e fontes

A inicial oferece “Nova solicitação” aos três papéis autenticados. A rota
`/solicitacoes/nova` verifica a identidade no servidor pelo mecanismo existente
e apresenta título, explicação e “Cancelar”. O cancelamento retorna a `/`, sem
confirmação. Não há formulário, envio, chamada de criação, migration nem mudança
de contrato de persistência. US-007 e US-009 continuam responsáveis pelas etapas
seguintes e pela distinção entre solicitante e autor do envio.

Foram lidos as instruções do repositório, glossário, ADRs 0002/0003 e referências.
A consulta ao vivo confirmou a spec publicada, lista “Sprint 1 — João”, membro
João R e ausência de comentários no cartão. DEC-001 e DEC-002 também foram
consultadas. O checklist consultado pela ferramenta específica ainda possui
redação histórica: somente Cliente, denúncia de dano e formulário. Prevalecem a
spec aprovada e os ADRs, conforme o pedido de implementação. Nenhum cartão ou
checklist foi alterado ou concluído nesta entrega local.

## Navegador com sessões reais

O script [tests/browser/us006.mjs](../tests/browser/us006.mjs) usa a infraestrutura
externa de Playwright já disponível para a US-002, sem dependência nova ou rota
artificial. Supabase local, Auth e perfis reais; contas fictícias existentes.
Não usa identidade simulada nem interceptação de respostas de autenticação.

Matriz: Cliente, Gestor e Manutentor em 390×900 e 1440×900. Para cada combinação:

1. Inicial sem sessão não apresenta a entrada. URL protegida retorna HTTP 307
   para `/conta/entrar`, inclusive em requisição direta sem seguir redirects.
2. Login válido retorna a `/` e exibe o nome real do perfil e a entrada.
3. Entrada, acesso direto e recarga exibem título, explicação e Cancelar,
   sem campos ou ação de envio. Resposta de recarga não permite cache.
4. Cancelar volta à inicial sem diálogo de confirmação.
5. Após logout, voltar pelo histórico e abrir a URL direta exige login;
   o título protegido não é apresentado. Novo login retorna a `/` com o nome
   do perfil; a sessão é encerrada novamente ao final.
6. Página legível, sem transbordamento horizontal; capturas de celular e desktop
   inspecionadas visualmente.

Também são verificadas sessão com tokens inválidos e sessão não renovável.
Nesta última, uma sessão real é preservada, o logout real revoga o refresh token
e apenas `expires_at` do cookie de teste recebe um valor passado. Isso força a
renovação no servidor sem alterar seu relógio e sem simular o Auth. A resposta
real recusa o refresh revogado e a aplicação exige login. Nos dois casos,
o roteiro também verifica novo login com destino `/` e encerra a nova sessão.

O primeiro teste de navegador falhou pela ausência da entrada; após a alteração,
a abertura e o cancelamento passaram. A matriz em desenvolvimento passou nos
comportamentos, mas sua asserção final detectou erros de `Performance.measure`
com timestamp negativo da instrumentação de desenvolvimento do Next/React.
A execução final usa `next build`/`next start`, mantendo a asserção de ausência
de erros JavaScript, sem ignorar mensagens.

## Reprodução

Com Supabase local configurado e contas fictícias preparadas conforme
[desenvolvimento local](desenvolvimento-local.md), execute os checks de integração
antes do navegador. A preparação de fixtures e os testes de persistência podem
criar registros; não os execute simultaneamente com a prova de ausência de escrita.

```sh
npm run build
npm start -- --port 3100
```

Em outro terminal, aponte `PLAYWRIGHT_MODULE` para uma instalação existente de
Playwright. Na infraestrutura usada nesta sessão:

```sh
LD_LIBRARY_PATH=/tmp/dea-blog-playwright/libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/dea-blog-playwright \
PLAYWRIGHT_MODULE=/home/joao_ricardo/DEA-blog/node_modules/playwright/index.mjs \
node --conditions=react-server tests/browser/us006.mjs
```

O script restringe a execução à aplicação em loopback e ao Supabase local e
reutiliza `localAdmin()` somente para comparar as contagens de `solicitacoes` e
`historico_solicitacoes`. Credenciais administrativas não são impressas.
Capturas são gravadas em [evidencias/us-006](evidencias/us-006) por padrão;
`FIXIT_BROWSER_EVIDENCE_DIR` permite escolher outro diretório. O roteiro captura
a página protegida, o login exigido após logout ou perda de sessão e a inicial
após novo login. `FIXIT_BROWSER_URL` permite selecionar outra porta local.

## Resultados executados

- `npm run lint`: aprovado, sem avisos.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; `/solicitacoes/nova` renderizada dinamicamente.
- `npm test`: 7/7 aprovados.
- `sg docker -c 'npm run test:integration'`: 34/34 aprovados, sem skips.
- `git diff --check` e sintaxe do script de navegador: aprovados.
- Navegador no build de produção: seis combinações de papel/largura e sessões
  inválida/não renovável aprovadas; nenhum erro JavaScript.
- Banco antes/depois, sem testes concorrentes: **42 → 42 solicitações** e
  **42 → 42 eventos de histórico**. Zero novos registros.

A primeira execução de integrações sem o grupo Docker ativo passou 33/34;
a preparação repetida de fixtures falhou no subprocesso da CLI por acesso ao
Docker. A suíte inteira foi repetida com o grupo correto e passou 34/34.
O erro de instrumentação observado em desenvolvimento não ocorreu em produção.

Capturas representativas: [Cliente em celular](evidencias/us-006/cliente-390.png)
e [Gestor em desktop](evidencias/us-006/gestor-1440.png).

## Revisão automatizada

A skill `code-review` foi aplicada às alterações locais, incluindo arquivos novos,
contra a base acima; duas revisões independentes examinaram padrões e spec.

- Standards: 0 violações documentadas e 0 smells relevantes.
- Spec: 0 omissões, comportamentos incorretos ou ampliações de escopo.

A comprovação integrada do CA-03, a reconferência posterior e as pendências de
aceite estão no [relatório da US-002](validacao-us-002.md).

Referências técnicas verificadas: guias instalados do Next.js 16.4.2 de páginas,
Server Components e links; [SSR do Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
e [changelog](https://supabase.com/changelog). A mudança TLS anunciada para APIs
cloud não altera esta validação HTTP local. A integração existente usa `getUser`
para identidade confirmada pelo servidor e proxy para renovação e cookies.
