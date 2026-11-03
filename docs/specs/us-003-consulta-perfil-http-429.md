# US-003 — Preservar orientação de aguardar na consulta do perfil

## Problem Statement

Quando há excesso de tentativas ao consultar o perfil, o FixIt apresenta indisponibilidade genérica e perde a orientação de aguardar. Isso impede a pessoa de entender como prosseguir na abertura do perfil, na edição de dados e no encerramento de outras sessões. Se a senha já mudou, a mensagem também precisa preservar esse resultado.

## Solution

Preservar a classificação de HTTP 429 em todos os caminhos que consultam o perfil. Mostrar “Muitas tentativas. Aguarde um pouco antes de tentar novamente.”, com contexto adicional quando a senha já foi alterada e o encerramento das outras sessões permanece pendente. A pessoa repete a ação manualmente. Durante edição, manter dados não secretos e limpar senhas.

## User Stories

1. Como usuário autenticado, quero receber orientação para aguardar ao abrir meu perfil sob excesso de tentativas, para saber quando tentar novamente.
2. Como usuário autenticado, quero receber esse aviso ao salvar meu nome, para compreender por que o salvamento não prosseguiu.
3. Como usuário autenticado, quero manter o nome digitado após esse erro, para retomar a edição.
4. Como usuário autenticado, quero receber o aviso ao alterar meu e-mail, para aguardar antes de repetir.
5. Como usuário autenticado, quero preservar o novo e-mail digitado após esse erro, para evitar preenchê-lo novamente.
6. Como usuário autenticado, quero manter o modal aberto após o erro, para corrigir ou repetir a tentativa.
7. Como usuário autenticado, quero que a senha atual seja limpa após erro na alteração de e-mail, para não conservar credenciais no formulário.
8. Como usuário autenticado, quero receber o aviso ao alterar minha senha, para entender que preciso aguardar.
9. Como usuário autenticado, quero que todos os campos de senha sejam limpos após erro, para informar as credenciais novamente.
10. Como usuário autenticado, quero manter minha edição de nome ao usar os modais, para preservar a independência dos salvamentos.
11. Como usuário autenticado, quero permanecer na edição quando ocorrer somente HTTP 429, para não precisar entrar novamente sem necessidade.
12. Como usuário autenticado, quero receber orientação de aguardar ao repetir o encerramento das outras sessões, para retomar essa ação depois.
13. Como usuário que já alterou a senha, quero saber que a troca ocorreu mesmo se a consulta seguinte falhar, para compreender minha credencial vigente.
14. Como usuário com encerramento pendente, quero repetir somente esse encerramento após aguardar, para não trocar a senha outra vez.
15. Como usuário autenticado, quero decidir quando repetir manualmente uma ação, para controlar a nova tentativa.
16. Como usuário autenticado, quero mensagens compreensíveis e sem detalhes internos, para entender o problema com privacidade.
17. Como usuário em celular ou computador, quero visualizar os avisos e continuar a edição, para concluir a ação no dispositivo disponível.
18. Como Cliente, Manutentor ou Gestor, quero a mesma orientação no meu perfil, para receber tratamento consistente entre os papéis.

## Implementation Decisions

- Ajustar a consulta de perfil e seus consumidores no servidor e na página, preservando a classificação de excesso de tentativas até a apresentação da mensagem.
- Abranger abertura do perfil, salvar nome, alterar e-mail, alterar senha e encerrar outras sessões, incluindo a consulta posterior à troca de senha.
- HTTP 429 isolado não representa sessão perdida e não provoca redirecionamento ao login. Preservar os tratamentos específicos existentes de sessão perdida, indisponibilidade e gravação incerta.
- Se a consulta falhar antes de gravar, impedir a continuação da operação e não informar sucesso.
- Se a senha já mudou, comunicar a troca concluída e o encerramento pendente, orientar aguardar e repetir somente o encerramento. Preservar a sessão atual.
- Manter formulário/modal aberto após erro de edição; preservar nome e novo e-mail digitados e limpar todos os campos de senha.
- Reutilizar a mensagem sanitizada de excesso de tentativas. Acrescentar contexto de resultado parcial quando necessário.
- Manter tentativa manual sem acrescentar contagem regressiva, bloqueio temporizado ou repetição automática.
- Preservar o escopo atual de edição de nome, identidade obtida da sessão, independência dos salvamentos e contratos de autorização. Esta correção não exige mudança de esquema.
- Seguir os ADRs vigentes de Next.js/Supabase e da capacidade administrativa restrita para troca de e-mail. Ler as guias instaladas relevantes antes de codificar.
- Não há novo termo de domínio nem trade-off arquitetural que exija glossário ou ADR adicional.

## Testing Decisions

- Fronteira confirmada na entrevista: integração existente de perfil, conta, identidade e sessão com SDK, Auth e PostgreSQL locais reais; HTTP 429 controlado na fronteira de rede. Manter os caminhos reais de sucesso.
- Usar como precedentes os testes de troca de credenciais, preservação de sessão, revogação parcial e falhas HTTP existentes.
- Cobrir a consulta inicial, os três salvamentos, o encerramento isolado e a consulta após troca efetiva da senha. Distinguir erro anterior à gravação de resultado parcial posterior.
- Verificar comportamento externo: orientação de aguardar, ausência de sucesso indevido, ausência de gravação quando a consulta inicial falha, sessão preservada e repetição exclusiva do encerramento quando a senha já mudou.
- Verificar ausência de senhas e detalhes internos nos resultados; manter o tratamento de falhas de sessão e indisponibilidade.
- Conferir no navegador em celular e computador: aviso na abertura sem redirecionamento por 429; nome/e-mail preservados; modal aberto; campos de senha limpos; aviso de senha alterada com encerramento pendente. Conferir consistência nos três papéis.
- Executar lint, tipos, build e testes relevantes de perfil e gestão de contas, revisando a integração US-003/004. Registrar evidências e limitações. Testes destrutivos somente no ambiente local; preservar a decisão anterior de não criar suíte permanente de navegador.

## Out of Scope

- Reimplementar perfil, ampliar campos editáveis ou reabrir o escopo histórico de matrícula/setor.
- Criar política geral de limitação, temporizador, bloqueio ou repetição automática.
- Alterar regras de sessão, recuperação de senha, confirmação externa de e-mail ou gestão de dispositivos.
- Prometer invalidação instantânea de acessos já emitidos.
- Resolver a integração geral de branches ou a promoção cloud de migrations.
- Criar commits, fazer push ou abrir PR sem autorização expressa.

## Further Notes

- Fonte: [cartão desta correção](https://trello.com/c/e6Ukr9iC). Parent: [US-003](https://trello.com/c/dnMogmjC).
- Entrevista grill-with-docs concluída em 2026-10-31; escopo, tentativa manual, preservação de dados e validação de integração/interface confirmados pelo usuário. Consolidação e publicação solicitadas via to-spec.
- Estado consultado: Pronto para Implementação, sem responsável, comentários ou checklists. Preservar lista e atribuição; correção e aceite continuam pendentes.
- Triagem: ready-for-agent. A etiqueta não existe no quadro; registrar textualmente enquanto não for possível aplicá-la pelo conector.
- A divergência entre o perfil atual, com edição somente de nome após US-004, e a spec histórica da US-003 deve permanecer explícita. Esta correção não declara aceitos os campos ausentes.
- Evidência histórica: [relatório da US-003](https://github.com/Rebecamarini/FixIt/blob/ecb5cbc/docs/validacao-us-003.md); [código inspecionado na reconciliação](https://github.com/Rebecamarini/FixIt/blob/ecb5cbc/src/server/profile.ts); [PR #9](https://github.com/Rebecamarini/FixIt/pull/9).
- A classificação de 429 na conferência de senha e no logout já tem cobertura; falta a regressão específica da consulta de usuário.
- Esta spec consolida as decisões; implementar exige pedido claro e separado. Publicar a spec não autoriza commits, push ou PR.

## Acceptance Criteria

- [ ] Todos os caminhos definidos preservam a classificação de excesso de tentativas e orientam aguardar.
- [ ] Tentativas permanecem manuais.
- [ ] Dados não secretos e edição aberta são preservados; senhas são limpas; 429 isolado não encerra a sessão.
- [ ] Senha já alterada e encerramento pendente são comunicados separadamente, com repetição somente do encerramento.
- [ ] Regressão HTTP controlada cobre a consulta sem substituir o sucesso real.
- [ ] Interface em celular/computador e integração US-003/004 verificadas; lint, tipos, build e testes relevantes aprovados, com evidências e limitações registradas.
