# Validação da US-003 — perfil e credenciais

Execução local em 2026-10-24, sobre `HEAD e9daa84` mais alterações de trabalho.
[Spec](https://trello.com/c/dnMogmjC),
[T01 — Consultar e editar o próprio perfil](https://trello.com/c/QwPZeKPc),
[T02 — Alterar e-mail pelo perfil](https://trello.com/c/BAQgjkFB),
[T03 — Alterar senha e encerrar outras sessões](https://trello.com/c/sLaHxNCC).

Os cartões foram lidos ao vivo com descrições, comentários, checklists,
responsáveis, listas e bloqueadores: os três estavam em Pronto para Implementação,
sem membros, comentários ou checklists. T01 não tinha bloqueador; T02/T03 dependiam
da página de T01 integrada e validada. Spec, DEC-001/002, glossário, ADRs e contratos
foram consultados. T01 teve integração real e navegador nos três papéis/larguras
antes de iniciar os modais. Não alteramos os cartões nem presumimos responsáveis.

## Evidências por critério

| Entrega | Evidência e resultado |
| --- | --- |
| T01: consulta dos três papéis | Auth real, perfis reais de Cliente/Manutentor/Gestor, e-mail do Auth e papel do perfil protegido; navegador nos três papéis. |
| T01: validação e persistência | `tests/profile.integration.ts`: trim incluindo BOM/NBSP, matrícula textual com zeros, manutenção da própria matrícula, recarga por novo cliente SSR, setor existente e falha sem atualização parcial. |
| T01: unicidade e concorrência | Dois usuários disputam matrícula equivalente sem distinguir maiúsculas; só um salvamento vence. Salvamentos válidos subsequentes prevalecem. |
| T01: autorização | Gestor também não lê/escreve perfil alheio; chamadas com ID/papel/alvo extra são recusadas. UPDATE direto de ID/papel falha por grants; RLS impede UPDATE de terceiros. |
| T01: interface e cache | Link na inicial; salvar mantém página aberta; voltar sem mudança navega e com mudança pede descarte; recarga não recebe cache compartilhado. |
| T02: senha e e-mail | Senha atual incorreta e e-mail inválido recusados; novo endereço aplicado imediatamente; login pelo novo endereço funciona e pelo antigo falha. Sessão atual e independente renovam. |
| T02: unicidade e mensagens | Concorrência tem um vencedor; outra conta permanece com endereço original. Contagem do Mailpit permanece igual antes/depois da operação. Erro de duplicata não identificável orienta conferência sem afirmar causa. |
| T02: exceção de arquitetura | Usuário autorizou capacidade administrativa restrita após prova de que `updateUser` sempre pede confirmação. Registrada no ADR 0004, com segredo somente no servidor e ID da sessão. |
| T03: validação | Senha atual incorreta, menos de oito caracteres, repetição da atual e confirmação divergente não trocam credenciais. |
| T03: sessões | Depois da troca, somente a nova senha autentica; sessão atual renova, refresh token de sessão independente é recusado pelo Auth real. Não se exige revogação instantânea do access token. |
| T03: resultado parcial | Falha HTTP 503 controlada somente em `/logout?scope=others`, após troca real: retorna parcial; repetir somente encerramento funciona e a nova senha permanece válida. HTTP 429 orienta aguardar. |
| Interface dos modais | Nos três papéis, 390/1440 px: senha/e-mail reais, edição pessoal não salva preservada, erros mantêm e-mail e limpam senhas, Escape/Cancelar respeitam descarte, reabrir limpa conteúdo, foco fica no diálogo e retorna ao acionador. Digitação incremental após erro mantém foco no campo. |
| Sessão perdida | Remover cookies durante edição e enviar leva ao login com aviso de descarte. Login existente mantém destino inicial. |
| Falhas e confidencialidade | Respostas HTTP 503/429 controladas na fronteira HTTP, dados reais no caminho de sucesso. Mensagens não devolvem senha, SQL, stack ou resposta interna do provedor. |

Verificação de navegador por Playwright externo ao projeto, usando roteiro temporário
em `/tmp`; nenhuma suíte permanente de navegador ou dependência adicionada.
Capturas por papel e largura em [evidencias/us-003](evidencias/us-003/).
As capturas mostram o modal de e-mail após troca real; os testes também percorreram
o modal de senha e a página de perfil. Inspeção visual da captura mobile confirmou
conteúdo legível, sem rolagem horizontal e foco visível.

## Revisão e verificações

- Skill `code-review`, em dois agentes: padrões e aderência à spec, comparando
  alterações locais com HEAD e excluindo arquivos previamente modificados.
- Padrões: nenhuma violação documentada; nomenclatura das ações ajustada para
  `salvarEmail`/`salvarSenha`.
- Spec: corrigidos foco que saía do campo após erro e orientação de aguardar
  em HTTP 429 na revogação. Digitação incremental validada nos seis cenários;
  teste de falha parcial/repetição/429 passou após a correção.
- `supabase db advisors --local --type security --level warn`: sem achados.
- Lint, tipos e build passaram após as correções da revisão.
- `npm run verify`: passou com lint, tipos, build, **7 testes unitários e 41
  testes de integração**, sem falhas. Após os últimos ajustes de revisão,
  lint/tipos/build e o teste específico de revogação/429 também passaram.

## Operação e limites

As modificações locais preexistentes em `.gitignore`, `AGENTS.md`,
`docs/references/metricas-estaticas.md` e `docs/specs/us-003-perfil-e-senha.md`
foram preservadas. A validação inicial ocorreu sem commit, push, PR ou promoção
remota. Posteriormente, o usuário autorizou commit, push e abertura do PR;
a promoção remota continua fora desta entrega.

A migration foi aplicada e verificada no banco local existente sem reset/apagar
seus dados; histórico local reconciliado com a migration. A configuração local de
`double_confirm_changes` não é necessária à operação administrativa e seu arquivo
permanece como antes. O serviço local foi reiniciado sem remover volumes durante
a investigação dessa configuração.

Cloud foi inspecionado somente por leitura de configuração: confirmação de cadastro
estava desativada e Secure email change ativo. Não foram criadas contas, executados
testes destrutivos, aplicadas migrations ou alteradas configurações remotas.
Para disponibilizar no cloud, promover a migration pelo fluxo vigente e configurar
`SUPABASE_SECRET_KEY` no servidor Next.js para o mesmo projeto. Os critérios de
credenciais/sessões foram comprovados no Supabase local, não em contas cloud.

A falha parcial e os limites do provedor foram exercitados por integração HTTP;
não se simulou a apresentação do estado parcial no navegador. A janela residual
dos access tokens é aceita pela spec. Não há recuperação de rascunhos, detecção
de conflitos entre abas ou garantia de invalidação instantânea.


## Nova revisão antes da publicação do PR

A revisão completa solicitada após a implementação encontrou 0 achados de
Standards e 1 achado P2 de Spec ainda aberto: `consultarPerfil()` transforma
HTTP 429 de `/auth/v1/user` em indisponibilidade genérica, descartando a
classificação de excesso de tentativas antes de salvar perfil ou credenciais.
A reprodução controlada confirmou o comportamento. Falta preservar a orientação
de aguardar nessa consulta e cobrir o cenário em teste. O tratamento de 429
na verificação de senha e no encerramento das outras sessões já está coberto.
