# US-006 — Criar solicitação de manutenção

Fonte e publicação: [US-006 no Trello](https://trello.com/c/3ouBfqLb).
Entrevista concluída e entendimento aprovado na Q13 em 2026-10-24. Abordagem de testes confirmada após a entrevista.
Responsável: João, que assumiu a tarefa para desbloquear outras specs.
A aprovação e publicação desta spec não autorizam implementação, commits, push ou PRs.

## Problem Statement

Usuários autenticados ainda não têm uma entrada na aplicação para iniciar uma solicitação de manutenção. A base de persistência existe, mas falta a primeira página do fluxo e a possibilidade de desistir sem registrar um pedido. A ausência dessa página também impede usá-la como evidência real de proteção de acesso no aceite da US-002.

## Solution

Oferecer “Nova solicitação” na página inicial a Cliente, Gestor e Manutentor autenticados. A opção abre uma página protegida intitulada “Nova solicitação de manutenção”, com explicação breve e “Cancelar”. Cancelar retorna à página inicial, sem confirmação e sem gravar solicitação ou histórico.

Esta história entrega a abertura e o cancelamento. O formulário pertence à US-007 e o envio à US-009; esta entrega ainda não permite enviar um pedido.

## User Stories

1. Como Cliente autenticado, quero encontrar “Nova solicitação” na página inicial, para iniciar um pedido de manutenção.
2. Como Gestor autenticado, quero acessar a mesma entrada, para solicitar manutenção sem trocar de papel.
3. Como Manutentor autenticado, quero acessar a mesma entrada, para solicitar manutenção em nome próprio.
4. Como usuário autenticado de qualquer um dos três papéis, quero abrir a página diretamente pelo endereço, para acessar a funcionalidade.
5. Como usuário autenticado, quero identificar a página pelo título “Nova solicitação de manutenção”, para saber qual fluxo estou iniciando.
6. Como usuário autenticado, quero ler uma explicação breve sobre a finalidade da página, para entender o pedido de manutenção.
7. Como usuário autenticado, quero encontrar a opção “Cancelar”, para desistir da abertura.
8. Como usuário que cancela, quero retornar à página inicial sem confirmação, para encerrar esta etapa sem campos preenchidos.
9. Como usuário que abre, recarrega ou cancela a página, quero que nenhuma solicitação seja registrada, para que somente o futuro envio efetive o pedido.
10. Como usuário que desiste, quero que nenhum evento de histórico seja criado, para não registrar como solicitação uma intenção abandonada.
11. Como visitante sem sessão, quero ser encaminhado ao login ao tentar abrir a página protegida, para autenticar meu acesso.
12. Como usuário que voltou a entrar, quero seguir o fluxo vigente até a página inicial, para acessar a funcionalidade por sua entrada.
13. Como usuário que encerrou a sessão, quero que acesso direto ou pelo histórico do navegador exija autenticação, para preservar a proteção da página.
14. Como usuário com sessão inválida ou não renovável, quero que o servidor exija autenticação, para impedir acesso indevido.
15. Como usuário em celular ou desktop, quero uma página responsiva com a identidade visual existente, para acessar a funcionalidade em ambos.
16. Como responsável pela validação da US-002, quero verificar a proteção em uma página real de solicitações, para comprovar seu CA-03.

## Implementation Decisions

- Integrar a entrada à página inicial autenticada e criar a página de abertura no endereço de produto `/solicitacoes/nova`.
- Exibir entrada e página para Cliente, Gestor e Manutentor com identidade real. A autorização da página ocorre no servidor e reaproveita a sessão existente.
- Sem sessão válida, encaminhar ao login existente; login continua retornando à página inicial, sem retorno automático à página originalmente solicitada.
- Seguir a identidade visual existente e apresentação responsiva.
- Nesta entrega, apresentar somente título, explicação breve e “Cancelar”, sem formulário ou envio.
- Cancelar volta à página inicial sem confirmação. Abrir, recarregar e cancelar não invocam criação nem gravam solicitações ou histórico.
- Cancelamento desta etapa não representa a transição de uma solicitação persistida para o estado “Descartada”.
- A US-006 não exige migration nem alteração do contrato de persistência.
- O escopo do produto permanece completo para manutenção, gestão de bens patrimoniais e vínculos previstos. Retira-se denúncia de dano patrimonial como finalidade independente; um dano que demande manutenção pode ser descrito no pedido.
- Decisão obrigatória para US-007: Cliente e Manutentor solicitam somente em nome próprio; Gestor recebe “Em meu nome” como padrão e pode selecionar qualquer usuário ativo cadastrado, de qualquer papel. A seleção não faz parte da tela desta US-006.
- Decisão obrigatória para US-009: permitir envio pelos três papéis no servidor e banco; validar que o solicitante selecionado está ativo no envio; somente Gestor pode selecionar outra pessoa, inclusive em chamadas diretas ou manipuladas.
- Solicitante é a pessoa em cujo nome se faz o pedido. Autor do envio é quem o registra sob sua identidade autenticada. Em nome próprio, coincidem; na representação pelo Gestor, preservar os dois e a autoria real no histórico.
- US-009 deve adaptar modelo e contrato para essa distinção, preservando registros existentes, estado inicial Pendente e atomicidade da solicitação com o evento inicial. O contrato atual ainda restringe criação a Cliente e acumula autoria e referência de acesso próprio em um vínculo; não tratar a ampliação como já implementada.
- A criação pelos três papéis não concede acesso geral às solicitações de terceiros. Histórias de consulta deverão considerar solicitante e autor ao aplicar suas regras de visibilidade; essa autorização de consulta está fora desta entrega.

## Testing Decisions

- Abordagem confirmada pelo usuário: testar principalmente pelo navegador com sessões reais dos três papéis; consultar o banco apenas para comprovar ausência de escrita de solicitações e histórico.
- Preferir a fronteira mais alta existente: fluxo da aplicação pelo navegador. Não criar interfaces de teste, páginas artificiais ou testar detalhes internos de componentes.
- Cobrir integração da página inicial, página de abertura, sessão e navegação: entrada pelos três papéis, acesso direto, recarga e cancelamento.
- Comparar solicitações e eventos de histórico antes/depois do fluxo no ambiente local controlado, sem envios concorrentes de teste, comprovando zero novos registros.
- Cobrir ausência de sessão, logout seguido de URL direta e histórico do navegador, sessão inválida ou não renovável e retorno vigente à página inicial após login.
- Inspecionar celular e desktop para legibilidade e ausência de transbordamento horizontal.
- Usar como referência a validação de navegador com sessão real da US-002 e as verificações existentes de conta, identidade e persistência. Aproveitar a infraestrutura local existente, sem exigir nova dependência ou seam.
- Executar os checks pertinentes do projeto durante a futura implementação. Nenhum teste de aplicação foi executado nesta publicação de documentação.
- Aceite exige os comportamentos externos acima com sessão real. Não basta identidade simulada ou proteção exclusivamente visual.
- Testes de envio, representação e alterações de permissões pertencem às US-007/009.

## Out of Scope

- Campos, escolha de solicitante, validações de formulário e confirmação para descartar preenchimento: US-007.
- Envio, alterações no modelo/contrato, migrations de solicitante e autor, autorização de gravação e histórico inicial: US-009.
- Anexos, notificações, listagem/detalhes e acesso administrativo ou de atendimento.
- Persistência de rascunho e criação de registro ao iniciar ou cancelar.
- Retorno automático ao destino originalmente solicitado após login.
- Denúncia de danos como finalidade independente do produto.
- Implementação, commits, push ou abertura de PR por aprovação desta spec.

## Further Notes

- João assumiu esta entrega para desbloquear outras specs; substitui a responsabilidade histórica atribuída a Paulo. O membro João R já está atribuído no Trello.
- Esta página pode fornecer a evidência real exigida pelo CA-03 da [US-002](https://trello.com/c/BTDvLW6A) após implementação e validação integrada.
- [US-007](https://trello.com/c/iZDcaagO) e [US-009](https://trello.com/c/OjIFOkJc) devem reaproveitar as decisões de papéis, representação e autoria desta spec, sem reabri-las. Ainda precisarão especificar seus demais detalhes de interface, dados e consulta.
- Decisões de domínio registradas nos ADRs 0002 e 0003 e no glossário do projeto. As referências históricas importadas permanecem preservadas; as decisões desta entrevista prevalecem nos pontos de conflito.
- Contexto de escopo e sprint: [DEC-001](https://trello.com/c/iQhgWOan) e [DEC-002](https://trello.com/c/sA10ilUi). Manter o restante das decisões vigentes.
- Prioridade Essencial; tipo Funcional. Estimativa histórica da US-006: 2h, não reestimada nesta entrevista.
- Triagem definida: `ready-for-agent`. A etiqueta está ausente no board e sua criação não é suportada pelo conector atual; aplicação da etiqueta permanece pendente.
