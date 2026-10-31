# US-009 — Enviar solicitação

Confirmada em 2026-10-27 após grill-with-docs (Q1–Q13).
Referência canônica: [US-009 no Trello](https://trello.com/c/OjIFOkJc).
Responsável: João Ricardo (@joaor64), substituindo Paulo por pedido expresso.
Tipo: Funcional. Prioridade: Essencial. Sprint 1.
Triagem: **ready-for-agent**. A etiqueta visual não existe no board e o conector disponível não permite criá-la; aplicação visual pendente.
Esta publicação aprova a spec. Implementação, commits, push e PR dependem de pedidos separados.

## Problem Statement

Usuários dos três papéis já conseguem preencher e validar uma solicitação de manutenção, mas a interface ainda não envia. A base de persistência aceita somente Cliente e reúne solicitante e autoria em um vínculo, impedindo registrar corretamente pedidos feitos por Gestor em nome de outra pessoa.

É necessário concluir o envio com segurança, confirmar o registro e preservar preenchimento nas falhas, sem duplicar uma mesma tentativa nem criar solicitação sem histórico.

## Solution

Substituir “Validar preenchimento” por “Enviar solicitação”, reaproveitando formulário e validação da US-007. Enviar diretamente, sem diálogo adicional, e gravar solicitação Pendente com evento inicial na mesma transação.

Permitir envio pelos três papéis e representação exclusivamente pelo Gestor, distinguindo solicitante e autor do envio. Mostrar confirmação com identificador, estado e identificação da representação. Oferecer nova tentativa sem duplicação e manter o tratamento de falhas simples, proporcional ao contexto acadêmico.

## User Stories

1. Como Cliente, quero enviar em nome próprio, para registrar meu pedido de manutenção.
2. Como Manutentor, quero enviar em nome próprio, para solicitar manutenção sem trocar de papel.
3. Como Gestor, quero enviar em nome próprio, para registrar minhas necessidades.
4. Como Gestor, quero enviar em nome de qualquer conta ativa, de qualquer papel, para registrar o solicitante correto.
5. Como solicitante representado, quero permanecer identificado no pedido, para que ele seja associado a mim.
6. Como usuário, quero preservar a identidade de quem enviou, para manter a responsabilidade pelo registro.
7. Como usuário, quero enviar pelo formulário existente, para concluir o preenchimento na mesma página.
8. Como usuário, quero validação no envio, para corrigir dados inválidos antes da gravação.
9. Como usuário, quero erros compreensíveis junto aos campos, para identificar o que corrigir.
10. Como usuário, quero preservar os dados após erros, para evitar retrabalho.
11. Como usuário, quero que o sistema gere identificador, data e hora, para não precisar fornecê-los.
12. Como usuário, quero que o pedido comece Pendente, para aguardar o atendimento administrativo.
13. Como usuário, quero que o evento inicial seja registrado com o pedido, para ter rastreabilidade desde a criação.
14. Como usuário, quero que uma falha no histórico desfaça a solicitação, para não haver registro parcial.
15. Como usuário, quero uma confirmação após sucesso, para saber que meu pedido foi registrado.
16. Como usuário, quero ver o identificador e o estado na confirmação, para reconhecer o registro.
17. Como Gestor que representa outra pessoa, quero ver solicitante e autor na confirmação, para conferir em nome de quem enviei.
18. Como usuário, quero iniciar “Nova solicitação” após sucesso, para registrar outro pedido com formulário vazio.
19. Como usuário, quero poder voltar ao início após sucesso, para encerrar o fluxo.
20. Como usuário, quero impedir cliques repetidos durante o envio, para evitar submissões acidentais.
21. Como usuário, quero usar “Enviar novamente” após resposta perdida, para concluir a mesma tentativa com segurança.
22. Como usuário, quero ser avisado quando a tentativa já foi registrada, para reconhecer o sucesso sem criar outra solicitação.
23. Como usuário, quero poder fazer pedidos distintos com conteúdo igual, para registrar necessidades que se repetem.
24. Como usuário, quero que os dados permaneçam estáveis enquanto o resultado é desconhecido, para repetir a mesma tentativa.
25. Como usuário, quero corrigir os campos quando houver certeza de que nada foi gravado, para tentar novamente.
26. Como Gestor, quero ser informado se o solicitante foi excluído, para selecionar outra conta sem perder o preenchimento.
27. Como usuário, quero corrigir uma categoria indisponível, para enviar com uma referência válida.
28. Como Gestor, quero que o sistema não substitua automaticamente o solicitante por mim, para evitar atribuição indevida.
29. Como usuário com sessão expirada, quero ser informado da necessidade de entrar novamente, para retomar o envio.
30. Como usuário, quero poder autenticar em outra aba e repetir na página preservada, para manter meu preenchimento.
31. Como usuário, quero impedir envio ou recuperação da tentativa por outra identidade, para proteger meus dados.
32. Como usuário, quero receber aviso ao sair com resultado incerto, para saber que o pedido pode já estar registrado.
33. Como Cliente representado por um Gestor, quero que o pedido apareça nas minhas consultas existentes, para acompanhar minhas solicitações.
34. Como Cliente, quero continuar sem acesso a solicitações alheias, para preservar a privacidade.
35. Como usuário, quero preservar registros antigos e seus históricos, para manter a continuidade dos dados.
36. Como usuário, quero um resultado consistente quando envio e exclusão de conta concorrem, para evitar registro novo em nome de conta já excluída.
37. Como usuário, quero preservar o pedido concluído antes da exclusão, para manter seu histórico.
38. Como usuário de teclado ou celular, quero manter a acessibilidade e responsividade do formulário, para concluir o envio no meu dispositivo.

Estas histórias detalham a US-009 e não criam novos identificadores de produto.

## Implementation Decisions

- Reaproveitar formulário, consultas de opções, normalização, erros, foco e cancelamento da US-007. Substituir a ação de validação por envio direto, sem etapa ou diálogo adicional de revisão.
- Preservar local, categoria, assunto e descrição obrigatórios; motivo, pessoas ou áreas afetadas, frequência, tipo de utilização, riscos e patrimônios afetados opcionais. Aparar pontas, preservar espaços internos e tratar opcionais em branco como ausência. Não introduzir limites arbitrários.
- Preservar consulta de categoria cadastrada; patrimônios afetados continua texto livre, sem vínculo com inventário.
- Seguir ADRs 0001–0005: servidor Next.js, sessão real, autorização no servidor e permissões/RLS no banco. Não criar outra API interna apenas para consumo do formulário.
- Adaptar criação, modelo, contrato e autorização para os três papéis. Cliente e Manutentor somente em nome próprio; Gestor pode indicar qualquer conta ativa de qualquer papel. Contas excluídas ou com provisionamento pendente não são elegíveis.
- Separar solicitante de autor do envio. Autor vem sempre da sessão; campos protegidos não ficam sob controle do formulário, inclusive em chamadas manipuladas.
- Revalidar dados, categoria, identidade e atividade do solicitante no envio. Validação anterior não garante disponibilidade posterior.
- Preservar registros existentes: nos legados, solicitante e autor coincidem. Usar novas migrations, preservando histórico.
- Banco gera identificador, data/hora e estado Pendente. Solicitação e exatamente um evento inicial são atômicos; evento registra autoria real, instante da criação, estado anterior ausente e novo estado Pendente, com solicitante distinguível.
- Falha no evento inicial impede a solicitação. Não apresentar erros internos ou credenciais ao usuário.
- Consulta existente de Cliente passa a acompanhar o solicitante, inclusive quando Gestor enviou. Histórico preserva o Gestor como autor. Não conceder leitura geral a terceiros.
- Ampliação de consultas próprias de Manutentor e Gestor fica nas histórias de consulta. A confirmação deve funcionar para todos os papéis sem depender de uma futura tela de detalhes.
- Mostrar confirmação com identificador, Pendente, “Nova solicitação” e “Voltar ao início”; em representação, mostrar solicitante e autor explicitamente.
- “Nova solicitação” abre formulário vazio e inicia outro pedido. Conteúdo igual em pedidos distintos é permitido.
- Bloquear cliques durante envio e garantir repetição segura da mesma tentativa preservada na página, inclusive diante de chamadas concorrentes. A mecânica técnica deve ser a mínima necessária para esse comportamento.
- Com resposta perdida e resultado incerto, preservar dados e bloquear alterações. Oferecer “Enviar novamente”: se já gravada, informar “Esta solicitação já foi registrada” e apresentar a confirmação; caso contrário, concluir a mesma tentativa. Não duplicar solicitação nem evento.
- Quando houver certeza de que nada foi gravado, liberar edição, correção e nova tentativa. Não manter bloqueio após erro confirmado de validação ou gravação.
- Solicitante excluído exige nova seleção, sem trocar automaticamente pelo Gestor; categoria indisponível exige correção. Preservar demais campos.
- Sessão expirada exige login; preservar formulário enquanto a página estiver aberta e permitir login em outra aba. Uma sessão de outra conta não pode enviar ou recuperar a tentativa anterior.
- Sem recuperação de rascunho ou tentativa após sair/recarregar. Ao sair com resultado incerto, avisar que o pedido pode estar registrado e que novo preenchimento será outro pedido, usando o aviso nativo quando suportado.
- Se exclusão vencer a disputa com envio, recusar envio e pedir nova seleção; se envio vencer enquanto a conta estiver ativa, preservar solicitação e histórico após exclusão. Recadastro não herda vínculos antigos.
- Preservar acessibilidade e responsividade existentes. Ler os guias do Next.js instalado antes da implementação.
- Aplicar solução proporcional ao projeto acadêmico, sem infraestrutura adicional de recuperação para casos excepcionais.

## Testing Decisions

- Fronteira aprovada na Q12 e ratificada na consolidação Q13: fluxo real da aplicação pelo navegador, com sessões reais dos três papéis, complementado por banco/API para autorização, concorrência e atomicidade.
- Testar comportamento externo e invariantes de domínio, evitando detalhes internos ou novas abstrações apenas para testes.
- Reutilizar infraestrutura e precedentes dos testes existentes de formulário da US-007, criação e atomicidade da base de solicitações e consultas próprias.
- Cobrir os três papéis em nome próprio e Gestor representando solicitantes de qualquer papel; conferir confirmação, autoria real e solicitante.
- Cobrir validação, categoria indisponível, solicitante excluído, preservação de dados, foco/erros e correção após falha confirmada.
- Verificar sessão expirada, autenticação na página preservada e recusa de outra identidade.
- Exercitar cliques concorrentes, resposta perdida e “Enviar novamente”, comprovando um registro e um evento. Conferir aviso de registro existente e permitir novo pedido distinto de conteúdo igual.
- Comprovar falha real do histórico produzindo zero registros parciais, com mecanismo controlado de teste local e sem failpoint em produção.
- Exercitar chamadas diretas/manipuladas para impedir falsificação de autoria, representação por outro papel e alterações de campos protegidos.
- Conferir consulta do Cliente pelo solicitante e isolamento entre Clientes; preservar legados na migração.
- Comprovar resultado consistente de envio concorrente à exclusão e preservação do registro concluído antes da exclusão/recadastro.
- Executar checks pertinentes do projeto durante implementação; evitar infraestrutura de testes desproporcional ao contexto acadêmico.
- Nenhum teste de aplicação foi executado nesta publicação de documentação.

## Out of Scope

- Implementação nesta publicação, commits, push, PR e deploy.
- Anexos: US-008.
- Notificações internas aos Gestores: US-012. Essa responsabilidade já foi registrada diretamente naquele cartão.
- Novas telas de consulta e ampliação de consultas próprias de Manutentor e Gestor.
- Prioridade, urgência, setor responsável, Manutentor, atribuições e transições administrativas no envio.
- Denúncia de dano como finalidade independente e vínculo formal do texto de patrimônios afetados ao inventário.
- Recuperação persistente de rascunho ou tentativa, sincronização entre dispositivos e fila offline.
- Outra etapa de revisão ou diálogo de confirmação antes de enviar.
- Deduplicar pedidos distintos apenas por conteúdo igual ou ampliar acesso geral a solicitações de terceiros.

## Further Notes

- Entendimento consolidado confirmado na Q13; usuário solicitou publicação via to-spec, sem nova entrevista. Testes já aprovados na Q12.
- US-006 e US-007 implementaram abertura/formulário. A base atual ainda restringe criação a Cliente e acumula autoria e consulta própria; esta spec define a adaptação futura.
- A divisão de escopo prevalece sobre o CA-02 histórico que incluía notificação no envio; essa entrega pertence à [US-012](https://trello.com/c/wJn6L3ym). Novas consultas pertencem às histórias correspondentes.
- Preservar os conceitos existentes de solicitante e autor do envio. Não há novo termo ou decisão arquitetural que exija outro glossário ou ADR.
- Cartão em Sprint 1 — João, com João Ricardo registrado como responsável na descrição. O membro visual permanece Paulo por limitação do conector, que não oferece alteração de membros de cartão.
- ready-for-agent registra suficiência da spec; aplicação visual pendente por inexistência da etiqueta e ausência de operação para criá-la no conector.
- Estimativa histórica de 2h não foi reestimada; vencimento histórico não constitui cronograma confirmado.
- Referências: [US-006](https://trello.com/c/3ouBfqLb), [US-007](https://trello.com/c/iZDcaagO), [US-004](https://trello.com/c/waxQ1rjj), [DEC-001](https://trello.com/c/iQhgWOan) e [DEC-002](https://trello.com/c/sA10ilUi). Decisões aprovadas posteriores prevalecem sobre requisitos históricos conflitantes.
