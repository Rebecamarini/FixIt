# US-002 — Entrar e sair do sistema

## Problem Statement

Cliente, Manutentor e Gestor precisam entrar no FixIt com suas credenciais e encerrar a sessão atual com segurança. Parte do fluxo foi antecipada na US-001, mas falta consolidar o aceite para os três papéis e comprovar que páginas protegidas deixam de permitir acesso após a saída ou a perda da sessão.

## Solution

Reaproveitar o login/logout já entregue e completar sua validação para os três papéis. Todos entram com e-mail e senha e chegam à mesma página inicial autenticada, com nome e opção Sair. A sessão persiste enquanto puder ser renovada; sair encerra a sessão atual e retorna ao login.

A proteção é aplicada pelo servidor e pelo controle de acesso aos dados. A comprovação pela interface de uma página protegida exige integrar uma tela real de solicitações e permanece condição de conclusão do card.

## User Stories

1. Como Cliente, quero entrar com meu e-mail e senha cadastrados, para acessar o FixIt com minha identidade.
2. Como Manutentor, quero usar o mesmo login com minhas credenciais, para acessar o sistema com meu papel.
3. Como Gestor, quero usar o mesmo login com minhas credenciais, para acessar o sistema com meu papel.
4. Como usuário, quero chegar à página inicial com meu nome após entrar, para reconhecer a conta em uso.
5. Como usuário, quero que meu papel seja reconhecido de forma confiável, para que o acesso respeite minhas permissões.
6. Como usuário, quero uma mensagem clara quando as credenciais forem inválidas, para corrigir o acesso sem iniciar uma sessão indevida.
7. Como usuário, quero manter o e-mail preenchido e ter a senha apagada após falha de login, para corrigir a tentativa sem conservar a senha no formulário.
8. Como usuário, quero receber orientação quando houver excesso de tentativas, para saber que preciso aguardar antes de tentar novamente.
9. Como usuário, quero uma mensagem compreensível em caso de indisponibilidade, para entender a falha sem receber detalhes internos do sistema.
10. Como usuário, quero continuar autenticado ao recarregar a página, para manter a continuidade do acesso.
11. Como usuário, quero continuar autenticado entre visitas enquanto minha sessão puder ser renovada, para retomar o uso do sistema.
12. Como usuário autenticado, quero voltar à página inicial ao abrir login ou cadastro, para evitar repetir um acesso já realizado.
13. Como usuário, quero sair pela opção Sair, para encerrar a sessão atual e retornar ao login.
14. Como usuário, quero que sair desta sessão preserve minhas sessões independentes, para encerrar apenas o acesso escolhido.
15. Como visitante, quero ver as opções públicas de acesso na página inicial, para entrar ou criar uma conta.
16. Como usuário que saiu, quero que páginas protegidas exijam autenticação novamente, para impedir acesso aos meus dados pela sessão encerrada.
17. Como usuário com sessão que não pode mais ser renovada, quero que uma página protegida solicite novo login, para recuperar o acesso com credenciais válidas.
18. Como usuário que entrou novamente, quero chegar à página inicial, para retomar a navegação por um destino consistente.
19. Como usuário em celular ou computador, quero um login legível e utilizável no meu dispositivo, para acessar o sistema com facilidade.
20. Como visitante sem conta, quero acessar o cadastro pela tela de login, para criar minha conta pelo fluxo existente.

Essas histórias detalham a US-002 existente; não criam novos identificadores de produto ou tarefas independentes.

## Implementation Decisions

- Responsável pela entrega: João Ricardo, conforme confirmação do usuário, descrição do card e DEC-002. O membro vinculado ao card ainda é Paulo; a divergência fica explícita.
- Reaproveitar os módulos existentes de conta, identidade e sessão e o avanço de login/logout da US-001. Conferir o estado do PR #5 antes de definir a base da implementação, sem presumir seu merge.
- Preservar Next.js e Supabase Auth como infraestrutura vigente, operações pelo servidor Next.js sob a identidade do usuário, sessão SSR em cookies, cliente por requisição e RLS combinada com privilégios no banco.
- Preservar o contrato de identidade autenticada com identificador e papel obtidos de Auth e perfil protegido. Metadados editáveis não concedem autorização.
- Não há necessidade de novo esquema, migration, tabela de credenciais ou API interna adicional identificada nesta especificação. Senhas permanecem sob responsabilidade do Auth, armazenadas com hash.
- Login válido dos três papéis leva à mesma página inicial autenticada, com nome e Sair. A página inicial permanece pública e adapta o conteúdo à presença de sessão.
- Credenciais inválidas não iniciam sessão; preservar e-mail e apagar senha. Excesso de tentativas e indisponibilidade recebem mensagens próprias e sanitizadas.
- Usuário autenticado que abre login ou cadastro retorna à página inicial.
- Manter sessão na recarga e entre visitas enquanto puder ser renovada. Sessão ausente ou não renovável não permite acesso protegido; a página protegida exige login. Após novo login, seguir à página inicial, sem retorno automático ao destino anterior.
- Sair encerra somente a sessão atual e retorna ao login. Sessões independentes continuam válidas.
- Preservar a propagação de cookies de renovação e a prevenção de cache compartilhado nas rotas com sessão. Incluir futuras rotas autenticadas no mecanismo existente de renovação e proteção quando integradas.
- Contas de Manutentor e Gestor usadas na validação são preparadas pelo procedimento administrativo existente. Login nesses papéis não antecipa permissões ou funcionalidades de histórias futuras.
- Não criar tela somente para testar proteção. Integrar ao menos uma tela real de solicitações para comprovar o CA-03. Preparação e testes da sessão podem avançar antes; conclusão do card depende da prova integrada.
- Preservar a identidade visual atual aprovada na US-001. O protótipo histórico orienta clareza e responsividade, sem exigir reprodução literal.
- Não disponibilizar atalhos de identidade ou endpoints de desenvolvimento no ambiente final.

## Testing Decisions

Estratégia confirmada pelo usuário em 2026-10-22: usar como fronteira principal a integração existente dos módulos de conta e sessão com Auth e banco reais no Supabase local, complementada por verificação no navegador. Preferir essa fronteira existente a novas abstrações de teste.

Um bom teste verifica comportamento observável: identidade reconhecida, sessão criada ou recusada, dados acessíveis ou bloqueados, mensagens e destinos de navegação. Não vincular testes à organização interna dos módulos nem simular Auth e banco para declarar aceite de integração real.

- Usar como referência as integrações existentes de cadastro/login/logout e de identidade reconstruída por cookies, isolamento entre sessões e rejeição de elevação de papel.
- CA-01: verificar login com contas reais de Cliente, Manutentor e Gestor, identidade/papel corretos no servidor e nome na página inicial; conferir recarga e nova visita com a mesma sessão.
- CA-02: verificar credenciais inválidas sem sessão, mensagem clara, e-mail preservado e senha apagada. Conferir mensagens de excesso de tentativas e indisponibilidade, sem vazamento de informações internas.
- CA-03, sessão: verificar saída, retorno ao login e ausência de acesso autenticado nas requisições seguintes. Uma sessão independente deve continuar válida. Conferir também sessão inválida ou não renovável.
- CA-03, página protegida: após integrar uma tela real de solicitações, acessá-la autenticado, sair e tentar abri-la diretamente e pelo histórico do navegador. Exigir autenticação sem expor dados. Repetir com sessão inválida ou não renovável e conferir destino inicial após novo login.
- Verificar isolamento em contextos independentes de navegador e redirecionamento de autenticado que abre cadastro/login.
- Conferir login, mensagens, navegação e saída no navegador em celular e desktop, usando os três papéis. A página inicial pública sem nome após logout não substitui a prova de uma página protegida.
- Executar lint, verificação de tipos, testes e build. Integrações destrutivas ficam restritas ao ambiente local.
- Registrar evidências e limitações por critério. A suíte permanente de navegador no repositório/CI continua adiada conforme decisão da US-001; a verificação pela interface permanece obrigatória.
- Antes de Concluído, exigir critérios satisfeitos, revisão por outro integrante e aceite no ambiente de testes pelo PO/professor, conforme o fluxo e a definição de pronto do projeto.

## Out of Scope

- Recuperação ou confirmação por e-mail, login social/institucional, 2FA e integrações institucionais.
- Lembrar de mim, regra nova de expiração por inatividade e saída de todos os dispositivos.
- Retorno automático à página originalmente solicitada após novo login.
- Dashboards ou páginas iniciais diferentes por papel.
- Gestão de papéis, edição de perfil/senha, alterações no autocadastro e permissões de funcionalidades futuras.
- Construção das telas de solicitações nesta tarefa ou de tela provisória para comprovar proteção.
- Implantação de uma suíte permanente de navegador no repositório/CI.
- Novas camadas BCE, Singleton, servidor Spring Boot, tabela própria de credenciais ou API interna/Swagger apenas para esta história.

## Further Notes

**Origem e status:** [US-002](https://trello.com/c/BTDvLW6A), épico Usuários e acesso, prioridade Essencial, tipo Funcional, Sprint 1; estimativa histórica de 3h, sem nova estimativa ou compromisso de datas nesta entrevista. [DEC-001](https://trello.com/c/iQhgWOan) e [DEC-002](https://trello.com/c/sA10ilUi) orientam o escopo.

**Decisão:** entrevista grill-with-docs consolidada e aprovada em 2026-10-22; estratégia de testes confirmada separadamente. Publicar esta spec não autoriza implementar. Triagem definida: ready-for-agent, indicando especificação suficiente para execução posterior, sem afirmar aceite completo ou ausência de dependências. Aplicação da etiqueta pendente: ela não existe no quadro e o conector disponível não oferece criação de etiquetas.

**Ponto de partida:** [US-001](https://trello.com/c/nxKsfzLE) em Code Review, com [PR #5](https://github.com/Rebecamarini/FixIt/pull/5), conforme Trello consultado nesta sessão. O código examinado corresponde ao commit 49d4719494bb6698d0dada0a49ac31c537eaec56. Conferir o estado integrado antes da execução.

**Dependência do aceite integrado:**

- Blocked by: https://trello.com/c/3ouBfqLb (US-006, alternativa de integração).
- Blocked by: https://trello.com/c/Qq6TOsG4 (US-010, alternativa de integração).

Essas dependências são alternativas: basta ao menos uma tela real de solicitações integrada à sessão, com comportamento protegido verificável. Não é necessário concluir ambas. O estado da comprovação e as pendências de aceite são mantidos no [relatório de validação da US-002](../validacao-us-002.md). A validação ampliada de usuários permanece em [S1-J02](https://trello.com/c/A7gG1pal); o contrato de sessão de [S1-J01](https://trello.com/c/x3tAilqC) já tem base técnica, sem encerramento automático desse card.

**Critérios originais preservados:** CA-01, os três papéis entram com e-mail/senha; CA-02, credenciais inválidas não iniciam sessão e geram mensagem clara; CA-03, sair encerra a sessão e páginas protegidas voltam a exigir autenticação. Nenhuma conclusão automática de outras histórias.

**Rastreabilidade documental:** conferidas as páginas citadas do [PDF original](https://drive.google.com/file/d/1I5cV1HBkDOD-SeDdKiYvBPb7Tq6SdB5m/view) na cópia importada em 17/10/2026, sem comprovar atualizações posteriores no Drive:

- Página 33: e-mail e credencial protegida; a entidade Login histórica não exige nova estrutura.
- Páginas 45–46: caso de consulta com entrada pelo login e exceções por falta de autenticação/senha incorreta. Sustenta integração futura, sem substituir o destino confirmado.
- Página 50, incluindo inspeção visual: login desktop/mobile, acesso ao cadastro e navegação compreensível, com referência a até três interações. Esqueci minha senha no protótipo é histórico e permanece excluído.
- Páginas 76–77: separar autenticação/sessão de cadastro/gestão de papéis. Recuperação e exemplo de 2FA não ampliam o escopo vigente.
- Página 103, NFSEG001: restringir funcionalidades a usuários autorizados; verificar acesso direto no servidor. Papéis atuais prevalecem sobre a redação antiga de administradores/clientes.
- [Trabalho 01 editado](https://docs.google.com/document/d/1O275g2lke_M2Ve4ghh0_PStPR6ynMKjsXm8GFexG20s/edit), seções 4.1 e 7.3: critérios da US-002 e definição de pronto.
- [Trabalho 02](https://docs.google.com/document/d/1uxobkjnoZNWWNNLMemSuqC0e1liynxe4bRn7kBHi2CE/edit): Auth, RLS e privilégios. ADR 0001 e decisões atuais prevalecem sobre arquitetura histórica.

Nenhum novo ADR ou termo de domínio é necessário: as decisões preservam a arquitetura e o vocabulário existentes.
