# US-007 — Detalhar solicitação

Confirmada em 2026-10-26, após grill-with-docs (Q1–Q11).
Referência canônica: [US-007 no Trello](https://trello.com/c/iZDcaagO).
Responsável: João, que assumiu a história nesta entrevista, substituindo a atribuição histórica a Paulo.
Tipo: Funcional. Prioridade: Essencial. Sprint 1.
Triagem: **ready-for-agent**. A etiqueta visual não existe no board e o conector disponível não permite criá-la; sua aplicação permanece pendente.
A aprovação e publicação desta spec não autorizam implementação, commits, push ou PR.

## Problem Statement

Usuários autenticados já podem iniciar uma solicitação de manutenção, mas a página ainda não permite descrever o problema. Falta preencher e revisar as informações, escolher outro solicitante quando o autor é Gestor e desistir sem perder dados inadvertidamente.

O formulário precisa respeitar as decisões das US-006 e US-004, sem confundir solicitante com autor do envio, incluir contas excluídas nas novas seleções ou antecipar o envio da US-009.

## Solution

Ampliar a página “Nova solicitação de manutenção” com formulário único para Cliente, Manutentor e Gestor. Apresentar primeiro os campos obrigatórios e depois os complementares, permitindo revisão no próprio formulário.

Gestor começa em “Em meu nome” e pode buscar outra conta ativa. Oferecer “Validar preenchimento”, com erros compreensíveis e indicação explícita de que validar não envia. Preservar dados nas correções e falhas de consulta. Confirmar desistência quando houver alterações; abrir, preencher, validar ou desistir não grava solicitação nem histórico.

## User Stories

1. Como usuário autenticado de qualquer papel, quero preencher a página de nova solicitação, para contextualizar um pedido de manutenção.
2. Como Cliente, quero solicitar em nome próprio, para relatar minhas necessidades.
3. Como Manutentor, quero solicitar em nome próprio sem trocar de papel, para comunicar uma necessidade de manutenção.
4. Como Gestor, quero começar em “Em meu nome”, para preencher pedidos próprios diretamente.
5. Como Gestor, quero escolher “Em nome de outra pessoa”, para registrar o pedido com o solicitante correto.
6. Como Gestor, quero buscar contas ativas por nome ou e-mail, para encontrar o solicitante.
7. Como Gestor, quero ver nome, e-mail e papel nos resultados, para distinguir pessoas com nomes iguais.
8. Como Gestor, quero navegar em páginas de 20 resultados em ordem alfabética, para localizar usuários em listas maiores.
9. Como Gestor, quero selecionar uma conta ativa de qualquer papel, para representar qualquer usuário autorizado pelo domínio.
10. Como Gestor, quero alterar o solicitante sem apagar os outros campos, para corrigir a representação.
11. Como Cliente ou Manutentor, quero ver que solicito em nome próprio, para compreender a responsabilidade pelo pedido.
12. Como usuário, quero que solicitante e autor do envio permaneçam distintos, para preservar a autoria real na futura gravação.
13. Como usuário, quero informar o local em texto livre, para identificar onde ocorre o problema.
14. Como usuário, quero selecionar uma categoria cadastrada, para classificar o problema.
15. Como usuário, quero informar assunto e descrição, para resumir e explicar a necessidade.
16. Como usuário, quero informar opcionalmente o motivo, para complementar o contexto.
17. Como usuário, quero informar opcionalmente pessoas ou áreas afetadas, para explicar o impacto.
18. Como usuário, quero informar opcionalmente a frequência, para descrever a recorrência.
19. Como usuário, quero informar opcionalmente o tipo de utilização, para contextualizar o uso envolvido.
20. Como usuário, quero informar opcionalmente riscos, para comunicar condições relevantes ao atendimento.
21. Como usuário, quero descrever opcionalmente patrimônios afetados, para indicar os bens envolvidos sem selecionar itens do inventário.
22. Como usuário, quero identificar os campos obrigatórios desde a abertura, para saber o que preciso preencher.
23. Como usuário, quero revisar e alterar os dados na mesma página, para conferir o preenchimento.
24. Como usuário, quero que data e hora sejam registradas automaticamente no futuro envio, para não precisar fornecê-las.
25. Como usuário, quero validar o preenchimento sem enviar, para conferir os dados nesta entrega.
26. Como usuário, quero receber erros junto aos campos e foco no primeiro inválido, para corrigir o formulário.
27. Como usuário, quero que a correção atualize os erros após a primeira tentativa, para acompanhar o que falta resolver.
28. Como usuário, quero preservar o preenchimento após erros, para evitar retrabalho.
29. Como usuário, quero reconhecer quando o formulário está válido e ainda não foi enviado, para entender o resultado da validação.
30. Como usuário, quero que alterações posteriores removam a indicação de validade, para validar novamente os dados atuais.
31. Como usuário, quero tentar novamente uma consulta que falhou, para continuar sem apagar o preenchimento.
32. Como usuário, quero distinguir ausência de categorias de falha na consulta, para compreender por que não consigo concluir o preenchimento.
33. Como Gestor, quero reconhecer uma busca sem resultados, para ajustar a busca.
34. Como Gestor, quero poder voltar a “Em meu nome” se a consulta de usuários falhar, para continuar meu próprio pedido.
35. Como Gestor, quero ser informado quando o solicitante escolhido já foi excluído, para selecionar outra conta sem perder os dados.
36. Como Gestor, quero selecionar explicitamente uma conta recadastrada, para não confundi-la com a identidade excluída.
37. Como usuário, quero cancelar sem confirmação quando não há alterações, para sair diretamente.
38. Como usuário, quero confirmar a desistência com alterações, para evitar perder o preenchimento por engano.
39. Como usuário, quero escolher “Continuar preenchendo”, para manter meus dados.
40. Como usuário, quero escolher “Descartar preenchimento”, para voltar à página inicial sem registro.
41. Como usuário, quero que o navegador avise sobre alterações ao recarregar ou fechar a aba quando suportado, para reduzir perdas acidentais.
42. Como usuário, quero sair sem confirmação após reverter todos os dados ao estado inicial, para não receber aviso desnecessário.
43. Como usuário, quero que abrir, preencher, validar e desistir não criem solicitação nem histórico, para reservar o registro ao futuro envio.
44. Como usuário de teclado, quero alcançar campos, resultados, erros e ações de confirmação, para concluir o fluxo com autonomia.
45. Como usuário em celular ou computador, quero uma interface legível e responsiva, para preencher no dispositivo disponível.
46. Como usuário, quero que consultas de contas respeitem as permissões também no servidor, para proteger dados de terceiros.

Estas histórias detalham a US-007 e não criam identificadores adicionais de produto.

## Implementation Decisions

- Reaproveitar a página protegida e a entrada da US-006, com identidade real e autorização no servidor. Preservar a navegação vigente de login e cancelamento.
- Reaproveitar a arquitetura dos ADRs 0001–0005: operações pelo servidor Next.js, sessão existente, autorização no servidor e permissões/RLS no banco. Não criar outra API interna apenas para o formulário.
- US-007 entrega formulário, consulta de opções e validação; US-009 entrega envio, adaptação do modelo/contrato, autorização de gravação e histórico. Esta divisão substitui a divisão histórica conflitante do cartão.
- Preservar os campos do contrato vigente: local, categoria, assunto e descrição obrigatórios; motivo, pessoas ou áreas afetadas, frequência, tipo de utilização, riscos e patrimônios afetados opcionais em texto livre.
- Aparar pontas dos textos, preservar espaços internos, recusar obrigatórios vazios/somente espaços e tratar opcionais em branco como ausência. Não introduzir limites arbitrários de tamanho. Preservar rejeição de tipos inválidos e entradas não previstas nas fronteiras aplicáveis.
- Categoria vem do cadastro, começa sem seleção e deve ser válida. Não permitir texto livre como substituto da referência.
- Patrimônios afetados é descrição livre, sem vínculo formal com inventário. Data e hora são automáticas no envio, sem campo editável.
- Formulário único, obrigatórios primeiro e complementares depois, com revisão na própria página. Urgência, prioridade, setor responsável e Manutentor ficam fora para todos os papéis, inclusive Gestor.
- Cliente e Manutentor solicitam somente em nome próprio. Gestor tem “Em meu nome” como padrão e pode selecionar qualquer conta ativa de qualquer papel. Seleção de outra pessoa é obrigatória ao escolher essa modalidade.
- Reaproveitar a consulta de contas ativas da US-004, exclusiva de Gestor: busca por nome/e-mail, nome/e-mail/papel nos resultados, ordem alfabética e páginas de 20. Não exigir filtro por papel nem reintroduzir matrícula/setor pessoal.
- Contas excluídas e provisionamentos pendentes ficam fora da seleção. Não ampliar acesso geral aos perfis ou solicitações de terceiros para oferecer o seletor.
- Alterar solicitante preserva os demais campos. Solicitante é a pessoa em cujo nome se faz o pedido; autor do envio é a identidade autenticada. A futura integração deve preservar ambos conforme ADR 0003.
- Oferecer “Validar preenchimento” enquanto não existir envio. Validar dados e disponibilidade do solicitante selecionado sem gravar ou limpar o formulário; informar claramente que a solicitação ainda não foi enviada. US-009 substituirá essa ação por “Enviar solicitação”, reutilizando a validação.
- Validar ao acionar a opção, mostrar erros junto aos campos e focar o primeiro inválido. Após a primeira tentativa, corrigir campo atualiza seu erro. Alterar dados após sucesso remove a indicação de validade e exige nova validação.
- Em falha de consulta de categorias/usuários, informar indisponibilidade e oferecer “Tentar novamente”, preservando os dados. Distinguir carregamento, falha e ausência de resultados. Sem categorias, informar impossibilidade de concluir o preenchimento; busca de usuários sem resultados tem mensagem própria.
- Falha na busca de outra pessoa permite voltar a “Em meu nome”. Não selecionar automaticamente outra conta para contornar falha.
- Se a conta escolhida foi excluída antes da validação, pedir nova seleção, preservando campos e sem substituir automaticamente pelo Gestor. US-009 revalidará no envio, pois validação anterior não garante disponibilidade posterior.
- Recadastro com o mesmo e-mail é outra identidade; exige seleção explícita, sem transferir a escolha anterior.
- Cancelar ou sair com alterações pede confirmação. Comparar dados atuais com o estado inicial, incluindo modalidade/seleção de solicitante. Reverter todos os dados elimina a necessidade de confirmação. Texto usado somente para buscar usuários não constitui alteração da solicitação.
- “Continuar preenchendo” preserva dados; “Descartar preenchimento” retorna à página inicial sem registro. No estado inicial, cancelar sai diretamente.
- Recarregar/fechar aba usa aviso nativo quando disponível, sem prometer suporte universal. Não persistir nem recuperar rascunho após sair. Cancelamento de preenchimento não representa estado “Descartada” de solicitação persistida.
- Preservar identidade visual, responsividade e operação por teclado. Campos, mensagens, resultados e diálogo de desistência devem ser compreensíveis e acessíveis.
- Antes da futura implementação, ler os guias do Next.js instalado e documentação vigente aplicável. Preservar proteção contra cache compartilhado autenticado.

## Testing Decisions

- Fronteira principal aprovada na Q10: fluxo real da aplicação pelo navegador, com sessões reais de Cliente, Manutentor e Gestor. Preferir infraestrutura existente e evitar páginas artificiais, novas abstrações ou testes de detalhes internos.
- Verificar comportamento externo do formulário, consultas de opções, identidade e navegação: valores preservados, mensagens, foco, resultados e ausência de escrita.
- Usar como precedentes os fluxos de sessão/navegação da US-006 e as consultas autorizadas de contas da US-004.
- Cobrir obrigatórios ausentes/somente espaços, categoria sem seleção, opcionais em branco, normalização e revisão na mesma página. Conferir ausência dos campos administrativos e de data/hora editável.
- Cobrir Gestor em nome próprio e de outra pessoa, busca por nome/e-mail, homônimos, qualquer papel ativo, ordem/páginas, vazio e preservação dos campos ao mudar solicitante.
- Cobrir conta excluída entre seleção e validação, nova seleção exigida e recadastro com mesmo e-mail sem troca automática de identidade.
- Cobrir erros após primeira tentativa, correção, foco no primeiro inválido, sucesso sem envio e remoção da indicação de validade após alteração.
- Exercitar falhas de consulta e nova tentativa, diferenciando indisponibilidade de ausência de categorias/resultados. Falhas controladas não substituem integração real do sucesso.
- Cobrir cancelamento intacto, preenchimento alterado, mudança de solicitante, continuação, descarte, reversão completa e busca sem seleção. Verificar aviso nativo de saída onde suportado.
- Conferir uso por teclado, celular e computador e preservação da proteção de acesso da página.
- Verificar no servidor que Cliente, Manutentor e pessoas sem autorização não consultam contas alheias; esconder o seletor não basta.
- Comparar solicitações e histórico antes/depois de abrir, preencher, validar e desistir em ambiente local controlado, comprovando zero novos registros.
- Executar verificações pertinentes do repositório na futura implementação. Testes de envio, persistência, atomicidade e autorização da gravação pertencem à US-009.
- Nenhum teste de aplicação foi executado nesta publicação de documentação.

## Out of Scope

- Implementação nesta conversa, commits, push, PR ou deploy.
- Envio ou criação de solicitação/histórico, migrations e adaptação do modelo/contrato de autoria e solicitante: US-009.
- Anexos: US-008. Notificações e novas consultas/listagens de solicitações também ficam fora.
- Definição de urgência, prioridade, setor responsável e Manutentor; atribuições ou reatribuições.
- Persistência ou recuperação de rascunho e etapa separada de revisão.
- Vínculo formal com inventário no campo patrimônios afetados.
- Denúncia de dano como finalidade independente.
- Ampliação de permissões de consulta de solicitações de terceiros ou alteração das regras de contas da US-004.

## Further Notes

- Entendimento consolidado confirmado na Q11 em 2026-10-26; publicação solicitada via to-spec, sem nova entrevista. Fronteira de testes já aprovada na Q10.
- Pré-requisitos conferidos na branch feat/us-004-gerenciar-contas, HEAD 8c29e1a: US-006 e US-004 implementadas; US-003 também integrada. Alterações locais preexistentes preservadas.
- A base atual de criação ainda aceita somente Cliente e acumula autoria e acesso próprio em um vínculo. A ampliação de envio dos três papéis e distinção solicitante/autor continuam pendentes na US-009, sem bloquear a entrega deste formulário.
- Referências: [US-006](https://trello.com/c/3ouBfqLb), [US-004](https://trello.com/c/waxQ1rjj), [US-009](https://trello.com/c/OjIFOkJc), [DEC-001](https://trello.com/c/iQhgWOan) e [DEC-002](https://trello.com/c/sA10ilUi). Decisões posteriores documentadas prevalecem sobre redações históricas conflitantes.
- Nenhum novo ADR é necessário: os conceitos e decisões de domínio relevantes já constam do glossário e dos ADRs 0002, 0003 e 0005.
- Na consulta inicial e antes da publicação, o cartão estava em Sprint 1 — Paulo, sem membro atribuído. Esta spec registra João como responsável; atribuição visual de membro permanece pendente por limitação das ações disponíveis no conector.
- A estimativa histórica de 3h não foi reestimada. O vencimento existente não constitui cronograma confirmado.
- ready-for-agent indica especificação suficiente; não autoriza iniciar implementação nem publicar código.
