# Validação da US-009 — Enviar solicitação

Implementação local em 2026-10-28 da [spec](specs/us-009-enviar-solicitacao.md)
e dos tickets [T01 — nome próprio](https://trello.com/c/1eAE975t),
[T02 — representação](https://trello.com/c/jliCmmvU) e
[T03 — repetição segura](https://trello.com/c/HyL9NwY6).
Fonte principal: [US-009 no Trello](https://trello.com/c/OjIFOkJc).
Os cartões estavam em Sprint 1 — João; a história ainda apresenta Paulo como
membro visual, mas sua descrição atribui o trabalho a João Ricardo.

## Entrega

O formulário existente envia diretamente e confirma identificador e Pendente.
Na representação, identifica solicitante e autor do envio. Nova solicitação
limpa o formulário e inicia outra tentativa, permitindo conteúdo igual.

Uma migração aditiva preenche solicitante nos legados, preserva eventos e
mantém consultas do Cliente vinculadas ao solicitante. A gravação autenticada
usa RPC invoker e função privada com autorização explícita; não usa chave
administrativa. Solicitação e evento inicial permanecem na mesma transação.

A tentativa tem UUID único no banco. A Server Action captura a identidade
original em closure criptografada do Next.js, preservada pelo formulário.
Outra conta não envia pelo formulário anterior nem reutiliza UUID registrado.
O lock transacional compartilhado com exclusão determina qual operação vence.
Uma repetição concluída preserva o solicitante histórico mesmo após exclusão.

Falha confirmada libera correção e preserva campos. Falha de transporte bloqueia
edição e oferece Enviar novamente. A página preservada permite login na mesma
conta em outra aba. A saída incerta exibe aviso; recarga usa confirmação nativa
quando suportada. Não há recuperação depois de sair/recarregar.

## Evidências

- Lint, typecheck e build de produção aprovados.
- Roteiro de navegador US-009 aprovado no build final, com 10 solicitações
  temporárias e seus eventos conferidos e removidos ao concluir.
- Suíte completa: 7 testes unitários e 40 testes de integração aprovados.
- Depois da correção da revisão, os 3 testes de envio passaram novamente,
  incluindo UUID alheio, representação por Manutentor e recadastro sem herança.
- Testes existentes comprovaram rollback real após falha no histórico,
  privacidade, validação, campos protegidos e consultas.
- Banco/API: três papéis, representação, concorrência da mesma tentativa,
  pedidos distintos iguais, exclusão concorrente, legados, recuperação após
  exclusão e recadastro sem herança.
- Advisors locais sem achados de nível warning/error; histórico de migrations
  locais alinhado. Nenhuma migração remota aplicada.

## Revisão

Standards: 0 achados. Spec: 2 achados corrigidos, 0 residuais.
A primeira revisão detectou UUID reutilizável entre autores e cobertura ausente
de recadastro. A correção tornou o UUID único globalmente, protegeu a identidade
da página em Server Action e acrescentou as verificações de autorização e
recadastro. O teste de UUID alheio falhou antes da correção e passou depois.

## Reprodução

Usar Supabase local e contas fictícias conforme
[desenvolvimento local](desenvolvimento-local.md). Executar:

```bash
npm run verify
npm run start -- --port 3102
```

Em outro terminal, com Playwright/Chromium externos já disponíveis:

```bash
FIXIT_BROWSER_URL=http://127.0.0.1:3102 \
PLAYWRIGHT_MODULE=/caminho/externo/playwright/index.mjs \
node --conditions=react-server tests/browser/us009.mjs
```

O roteiro cobre sessões dos três papéis, validação/foco, representação,
resposta perdida após commit, reenvio sem duplicação, novo pedido igual,
categoria removida, solicitante excluído, sessão perdida, recusa de outra conta,
login em outra aba, confirmação nativa de saída e layout móvel.
Nenhuma dependência de teste foi adicionada ao projeto.

O roteiro US-007 documenta o comportamento anterior de validação sem envio;
a substituição daquela ação por envio é verificada pelo roteiro US-009.
A migração foi aplicada somente no Supabase local. A publicação da branch e do
PR não promove a migração nem executa deploy.
