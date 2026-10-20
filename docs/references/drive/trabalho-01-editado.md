# **Trabalho**

Centro de Tecnologia \- CTC   
Departamento de Informática \- DIN   
Ciência da Computação   
Disciplina: Construção de Software 

**Trabalho 01 de Construção de Software** 

Rebeca Marini Silva \- RA 138155   
João Ricardo de Melo \- RA 138558  
Paulo Guilherme Schnaufer \- RA 139565

**Maringá, 2026**

**[1 . Definição do problema	2](#1-.-definição-do-problema)**

[2\.  Objetivo e público-alvo do software	3](#2.-objetivo-e-público-alvo-do-software)

[3\. Escopo inicial do projeto	3](#3.-escopo-inicial-do-projeto)

[4\. Histórias de usuário	3](#4.-histórias-de-usuário)

[5\. Representação da Arquitetura Inicial do Software	15](#5.-representação-da-arquitetura-inicial-do-software)

[5.1 Visão Lógica e Padrões	15](#5.1-visão-lógica-e-padrões)

[5.1.1 Padrão BCE (Boundary-Control-Entity)	16](#5.1.1-padrão-bce-\(boundary-control-entity\))

[5.1.2 Adequação ao Escopo Acadêmico (DEC-001)	16](#5.1.2-adequação-ao-escopo-acadêmico-\(dec-001\))

[5.2 Visão de Desenvolvimento e Física	17](#5.2-visão-de-desenvolvimento-e-física)

[5.2.1 Tecnologias escolhidas	17](#5.2.1-tecnologias-escolhidas)

[1.2.2 Topologia de implantação (Visão Física)	17](#5.2.3-topologia-de-implantação-\(visão-física\))

[6\. Backlog do Produto	18](#6.-backlog-do-produto)

[7\. Planejamento da Sprint 1	19](#7.-planejamento-da-sprint-1)

[7.1 Objetivo da Sprint	19](#7.1-objetivo-da-sprint)

[7.2 Backlog da Sprint 1	19](#7.2-backlog-da-sprint-1)

[7.3 Definition of Done (DoD), critérios básicos desta etapa	20](#7.3-definition-of-done-\(dod\),-critérios-básicos-desta-etapa)

# **1 . Definição do problema** {#1-.-definição-do-problema}

	A falta de um sistema integrado para os processos de solicitação, gestão e acompanhamento de manutenções, impede maior agilidade, um horizonte de planejamento ampliado, um controle mais efetivo do acesso de clientes aos serviços e uma melhor adequação às normas públicas estaduais de controle. O FixIt busca suprir essa lacuna, possibilitando uma maior comunicação entre os clientes e gestores da instituição e melhorando a qualidade e eficiência das manutenções, principalmente em grandes instituições.

##    **2\.  Objetivo e público-alvo do software** {#2.-objetivo-e-público-alvo-do-software}

O objetivo do software “FixIt” é ser uma ferramenta que facilita processos de manutenção, por meio da modernização da solicitação, controle e acompanhamento dos serviços de manutenção em determinada instituição. Além disso, o sistema mapeia os bens materiais, com foco em equipamentos eletrônicos, melhorando o controle desses dispositivos.   
      O público-alvo do Fixit são empresas de grande e médio porte que possuem dispositivos eletrônicos que precisem de manutenção e acompanhante. O sistema será utilizado principalmente por funcionários e gestores responsáveis pela manutenção e pelo patrimônio, além dos usuários que desejam solicitar e acompanhar serviços de manutenção.

###    **3\. Escopo inicial do projeto**  {#3.-escopo-inicial-do-projeto}

O escopo inicial do FixIt contempla o desenvolvimento de um sistema para registrar e acompanhar solicitações de manutenção, organizar informações dos equipamentos e auxiliar no controle dos bens patrimoniais. O sistema contará com diferentes tipos de usuários, permitindo que solicitações sejam abertas e acompanhadas e que os responsáveis possam organizar e atualizar os serviços.  
	Nesta primeira versão, o projeto focará no registro, controle e acompanhamento das manutenções e dos equipamentos, não abrangendo funcionalidades como controle financeiro, compra de peças ou integração com outros sistemas.

####  **4\. Histórias de usuário** {#4.-histórias-de-usuário}

Esta seção apresenta as histórias funcionais aprovadas para o FixIt, agrupadas por épico e acompanhadas de critérios de aceitação enxutos. Decisões de arquitetura e requisitos exclusivamente técnicos não fazem parte deste conjunto.

## **4.1 Usuários e acesso**

| \[US-001\] Auto Cadastrar Cliente |
| :---- |
| **Ator:** Visitante / Cliente |
| **Prioridade:** Essencial |
| **História:** Como visitante, quero criar uma conta informando nome, e-mail, senha, matrícula e setor, para acessar o FixIt como Cliente. |
| **Critérios de aceitação:** CA-01: O formulário exige nome, e-mail, senha, matrícula e setor; e-mail e matrícula devem ser únicos e a senha deve possuir pelo menos 8 caracteres. CA-02: Um cadastro válido cria uma conta local com o papel Cliente. CA-03: Dados ausentes, inválidos ou duplicados impedem a criação e são informados ao visitante.  |

| \[US-002\] Entrar e sair do sistema |
| :---- |
| **Ator:** Cliente / Manutentor / Gestor |
| **História:** Como usuário, quero entrar e sair do FixIt com minhas credenciais, para controlar com segurança o acesso à minha sessão. |
| **Prioridade:** Essencial |
| **Critérios de aceitação:** CA-01: Cliente, Manutentor e Gestor podem entrar com o e-mail e a senha cadastrados. CA-02: Credenciais inválidas não iniciam sessão e geram uma mensagem clara. CA-03: Ao sair, a sessão é encerrada e páginas protegidas voltam a exigir autenticação. |

| \[US-003\] Consultar e editar perfil e senha |
| :---- |
| **Ator:** Cliente / Manutentor / Gestor |
| **Prioridade:** Importante |
| **História:** Como usuário autenticado, quero consultar e editar meus dados e alterar minha senha atual, para manter meu cadastro atualizado. |
| **Critérios de aceitação:** CA-01: O usuário autenticado visualiza somente o próprio perfil; o papel atual é exibido, mas não pode ser alterado pelo perfil. CA-02: Nome, e-mail, matrícula e setor podem ser atualizados, respeitando as validações e a unicidade. CA-03: A senha pode ser alterada mediante senha atual, nova senha válida e confirmação coincidente. |

| \[US-004\] Gerenciar papéis de usuário |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero listar usuários e alterar seus papéis entre Cliente, Manutentor e Gestor, para administrar as permissões do FixIt. |
| **Critérios de aceitação:** CA-01: Somente o Gestor pode listar usuários e alterar seus papéis entre Cliente, Manutentor e Gestor; novos cadastros começam como Cliente. CA-02: Uma alteração salva passa a determinar as permissões do usuário. CA-03: Cliente e Manutentor não conseguem acessar nem executar a gestão de papéis. |

| \[US-005\] Restringir ações e dados por papel |
| :---- |
| **Ator:** Cliente / Manutentor / Gestor |
| **Prioridade:** Essencial |
| **História:** Como usuário, quero acessar somente telas, ações e dados permitidos ao meu papel, para preservar a segurança e a privacidade do sistema. |
| **Critérios de aceitação:** CA-01: O Cliente acessa somente as próprias solicitações; o Manutentor atua somente nas atribuídas; o Gestor acessa as funções administrativas previstas. CA-02: Telas e ações sem permissão ficam indisponíveis para o papel do usuário. CA-03: Tentativas de acesso direto não autorizado são recusadas sem expor dados protegidos. |

**4.2 Solicitações do Cliente**

| \[US-006\] Criar solicitação de manutenção |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero iniciar uma solicitação de manutenção ou denúncia de dano patrimonial, para comunicar um problema à equipe responsável. |
| **Critérios de aceitação:** CA-01: Somente um Cliente autenticado pode iniciar uma solicitação de manutenção ou denúncia de dano patrimonial. CA-02: Cancelar o formulário antes do envio não cria registro. CA-03: O formulário do Cliente não apresenta urgência, prioridade, setor responsável ou Manutentor. |

| \[US-007\] Detalhar solicitação |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero informar data e hora, local, categoria, assunto, descrição, motivo, pessoas ou áreas afetadas, frequência, tipo de utilização, riscos e patrimônios afetados, para contextualizar o problema. |
| **Critérios de aceitação:** CA-01: O formulário contém os campos previstos na história; local, categoria, assunto e descrição são obrigatórios, e data e hora são registradas no envio. CA-02: O Cliente pode revisar e alterar os dados antes do envio, e as informações ficam associadas à solicitação. CA-03: Urgência, prioridade, setor responsável e Manutentor não fazem parte do detalhamento do Cliente. |

| \[US-008\] Anexar evidências à solicitação |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero anexar imagens ou arquivos à solicitação, para facilitar a identificação e o diagnóstico do problema. |
| **Critérios de aceitação:** CA-01: O Cliente pode anexar opcionalmente imagens JPG ou PNG e arquivos PDF antes do envio, podendo removê-los enquanto preenche o formulário. CA-02: Anexo inválido é recusado com mensagem clara sem apagar os demais dados preenchidos. CA-03: Após o envio, os anexos ficam no ambiente do FixIt e são exibidos somente a usuários autorizados |

| \[US-009\] Enviar solicitação |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero enviar a solicitação preenchida, para registrá-la com status Pendente e disponibilizá-la aos Gestores. |
| **Critérios de aceitação:**  CA-01: O envio de um formulário válido cria uma única solicitação identificada, vinculada ao Cliente e com status Pendente.  CA-02: A solicitação passa a aparecer para o Cliente e os Gestores, que recebem uma notificação interna. CA-03: Falha de validação ou gravação não cria registro parcial ou duplicado. |

| \[US-010\] Consultar minhas solicitações |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero listar somente as minhas solicitações, para acompanhar os pedidos que registrei. |
| **Critérios de aceitação:** CA-01: O Cliente visualiza somente suas solicitações, ordenadas da mais recente para a mais antiga e resumidas por identificação, assunto, categoria, data e status.  CA-02: Selecionar um item abre seus detalhes; tentar acessar solicitação de outro Cliente é recusado. CA-03: Quando não houver solicitações próprias, o sistema apresenta um estado vazio informativo. |

| \[US-011\] Visualizar detalhes e histórico da solicitação |
| :---- |
| **Ator:** Cliente |
| **Prioridade:** Essencial |
| **História:** Como Cliente, quero visualizar os detalhes, o status atual e o histórico de alterações de uma solicitação minha, para acompanhar seu progresso. |
| **Critérios de aceitação:**  CA-01: O Cliente visualiza dados, anexos, status, responsáveis e observações de uma solicitação própria . CA-02: O histórico é exibido em ordem cronológica, com data, autor e descrição, e permanece somente leitura. CA-03: O acesso aos detalhes ou ao histórico de outro Cliente é recusado. |

| \[US-012\] Receber notificações internas |
| :---- |
| **Ator:** Cliente / Manutentor / Gestor |
| **Prioridade:** Importante |
| **História:** Como usuário, quero visualizar dentro do FixIt notificações sobre eventos relevantes às minhas responsabilidades, para perceber mudanças sem depender de canais externos. |
| **Critérios de aceitação:** CA-01: O Gestor é notificado sobre nova solicitação, o Manutentor sobre nova atribuição e o Cliente sobre mudança de status em solicitação própria.  CA-02: A notificação interna apresenta evento, data, vínculo com a solicitação e estado lida ou não lida.  CA-03: O usuário recebe somente eventos relacionados às suas responsabilidades; não há e-mail, SMS, WhatsApp ou push. |

**4.3 Gestão e execução**

| \[US-013\] Listar solicitações para gestão |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Gestor ou Manutentor, quero visualizar as solicitações permitidas ao meu papel agrupadas por status, para organizar o trabalho. |
| **Critérios de aceitação:**  CA-01: O Gestor visualiza todas as solicitações não arquivadas e o Manutentor somente as atribuídas a ele. CA-02: As solicitações são agrupadas por Pendente, Aprovada, Em atendimento, Concluída e Descartada.  CA-03: Solicitações arquivadas ficam fora da listagem ativa e acessos não autorizados são recusados. |

| \[US-014\] Filtrar e ordenar solicitações |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Importante |
| **História:** Como Gestor ou Manutentor, quero filtrar e ordenar solicitações por status, categoria, prioridade, setor e responsável, para localizar demandas. |
| **Critérios de aceitação:**  CA-01: Gestor e Manutentor podem filtrar seu conjunto autorizado por status, categoria, prioridade, setor e responsável, sem campo de urgência. CA-02: Os filtros podem ser combinados e limpos; a ordenação pode usar data, prioridade ou status. CA-03: Sem filtros, a listagem volta à ordem da solicitação mais recente para a mais antiga. |

| \[US-015\] Visualizar detalhes administrativos |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Gestor ou Manutentor, quero acessar todos os dados de uma solicitação permitida ao meu papel, para avaliá-la ou executá-la. |
| **Critérios de aceitação:** CA-01: O Gestor pode abrir qualquer solicitação, enquanto o Manutentor abre somente as atribuídas a ele. CA-02: A tela apresenta os dados necessários à avaliação e execução, incluindo anexos, prioridade, setor, responsável, status e histórico.  CA-03: Ações e acessos diretos respeitam o papel, a atribuição e o estado atual. |
|  |

| \[US-016\] Aprovar ou descartar solicitação |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero aprovar ou descartar uma solicitação Pendente, para decidir se ela seguirá para atendimento. |
| **Critérios de aceitação:** CA-01: Somente o Gestor pode aprovar ou descartar uma solicitação Pendente. CA-02: A aprovação altera o status para Aprovada; o descarte altera para Descartada, estado terminal que não apaga o registro.• CA-03: A decisão é registrada no histórico e gera uma notificação interna para o Cliente. |
|  |

| \[US-017\] Definir prioridade da solicitação |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero atribuir uma prioridade à solicitação aprovada, para ordenar seu atendimento. |
| **Critérios de aceitação:** CA-01: Somente o Gestor pode definir ou alterar a prioridade de solicitação aprovada e ainda não concluída ou descartada. CA-02: As opções são Baixa, Média e Alta, e o valor aparece nos detalhes, listagens e filtros. CA-03: A alteração entra no histórico; Cliente e Manutentor não definem prioridade e urgência não existe no sistema. |
|  |

| \[US-018\] Definir setor e Manutentor responsáveis |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero definir o setor responsável e atribuir um Manutentor à solicitação, para encaminhar a demanda à execução. |
| **Critérios de aceitação:** CA-01: Somente o Gestor pode escolher, em uma solicitação aprovada, um setor interno e um usuário com papel Manutentor.  CA-02: Setor e responsável ficam visíveis nos detalhes e listagens, e o Manutentor recebe uma notificação interna.  CA-03: A atribuição entra no histórico; o Cliente não pode escolher ou alterar responsáveis. |
|  |

| \[US-019\] Consultar minhas atribuições |
| :---- |
| **Ator:** Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Manutentor, quero visualizar as solicitações atribuídas a mim, para saber quais demandas devo atender. |
| **Critérios de aceitação:** |
| • CA-01: O Manutentor visualiza somente solicitações atribuídas a ele, resumidas por identificação, assunto, prioridade, setor e status.• CA-02: Selecionar um item abre os detalhes e as ações permitidas.• CA-03: Solicitação não atribuída não pode ser visualizada ou alterada pelo Manutentor. |

| \[US-020\] Atualizar status da solicitação |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como usuário autorizado, quero avançar a solicitação pelas transições permitidas, para registrar corretamente seu andamento. |
| **Critérios de aceitação:**  CA-01: O Gestor realiza Pendente para Aprovada ou Descartada; o Gestor ou Manutentor atribuído realiza Aprovada para Em atendimento e Em atendimento para Concluída. CA-02: O sistema bloqueia saltos, retornos de estado, alterações em Descartada e ações sem autorização. CA-03: Cada transição entra no histórico e gera uma notificação interna para o Cliente. |
|  |

| \[US-021\] Registrar execução e observações |
| :---- |
| **Ator:** Manutentor / Gestor |
| **Prioridade:** Essencial |
| **História:** Como Manutentor ou Gestor, quero adicionar informações de execução e observações à solicitação, para documentar o atendimento realizado. |
| **Critérios de aceitação:**  CA-01: O Gestor ou o Manutentor atribuído pode adicionar uma informação de execução ou observação não vazia. CA-02: Cada registro guarda conteúdo, data e autor e aparece nos detalhes e no histórico.  CA-03: O Cliente pode consultar os registros de uma solicitação própria, mas não pode alterá-los. |
|  |

| \[US-022\] Visualizar dashboard Kanban |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Importante |
| **História:** Como Gestor, quero visualizar as solicitações em colunas por status, para acompanhar o fluxo de trabalho. |
| **Critérios de aceitação:**  CA-01: Somente o Gestor acessa o Kanban com as colunas Pendente, Aprovada, Em atendimento, Concluída e Descartada. CA-02: Cada solicitação não arquivada aparece em uma única coluna, com identificação, assunto, prioridade, setor e responsável quando definidos. CA-03: Botões permitem as transições válidas e movem o cartão para a coluna correspondente; arrastar cartões é opcional. |
|  |

| \[US-023\] Preservar histórico da solicitação |
| :---- |
| **Ator:** Cliente / Manutentor / Gestor |
| **Prioridade:** Essencial |
| **História:** Como usuário autorizado, quero que mudanças relevantes registrem data, autor, estado anterior e novo estado, para manter a rastreabilidade da solicitação. |
| **Critérios de aceitação:**  CA-01: Mudanças de status, prioridade, setor, Manutentor e execução geram eventos com data, autor e valores anterior e novo quando aplicável.  CA-02: O histórico é cronológico, somente leitura e segue as permissões de Cliente, Manutentor e Gestor.  CA-03: Descarte ou arquivamento não remove eventos já registrados. |
|  |

| \[US-024\] Arquivar solicitação |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Importante |
| **História:** Como Gestor, quero excluir logicamente uma solicitação conforme as regras do sistema, para removê-la das listas ativas sem apagar seu histórico. |
| **Critérios de aceitação:** CA-01: Somente o Gestor pode arquivar uma solicitação, removendo-a das listagens ativas e do Kanban. CA-02: Dados, anexos, vínculos e histórico permanecem armazenados e consultáveis pelo Gestor em uma área de arquivados. CA-03: O arquivamento registra data e autor e nunca realiza exclusão física. |
|  |

**4.4 Patrimônio**

| \[US-025\] Cadastrar bem patrimonial |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero cadastrar um bem com código único, descrição, marca, modelo, localização, estado de conservação, data de aquisição e garantia, para manter o inventário. |
| **Critérios de aceitação:** CA-01: Somente o Gestor cadastra bens com código único, descrição, marca, modelo, localização e estado de conservação; aquisição e garantia são registradas quando disponíveis. CA-02: Um cadastro válido cria um bem ativo disponível para consulta e vinculação. CA-03: Dados ausentes ou código duplicado impedem o cadastro; não há integração institucional. |
|  |

| \[US-026\] Consultar bens patrimoniais |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Gestor ou Manutentor, quero listar, pesquisar por código e visualizar os detalhes dos bens, para identificar o patrimônio atendido. |
| **Critérios de aceitação:** CA-01: Gestor e Manutentor podem listar bens ativos, pesquisar por código e abrir seus detalhes. CA-02: Os detalhes apresentam os dados patrimoniais e o acesso ao histórico permitido. CA-03: O Manutentor possui acesso somente de consulta, e uma pesquisa sem resultado exibe estado vazio. |
|  |

| \[US-027\] Editar ou arquivar bem patrimonial |
| :---- |
| **Ator:** Gestor |
| **Prioridade:** Essencial |
| **História:** Como Gestor, quero atualizar os dados ou excluir logicamente um bem, para manter o inventário correto sem perder seu histórico. |
| **Critérios de aceitação:**  CA-01: Somente o Gestor pode editar ou arquivar um bem, mantendo os campos obrigatórios e o código único. CA-02: O bem arquivado sai da listagem ativa e não recebe novos vínculos. CA-03: Solicitações vinculadas e histórico permanecem preservados; não ocorre exclusão física. |
|  |

| \[US-028\] Vincular bem à solicitação |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Gestor ou Manutentor autorizado, quero vincular uma solicitação a um ou mais bens cadastrados, para relacionar o atendimento ao patrimônio afetado. |
| **Critérios de aceitação:**  CA-01: O Gestor pode vincular bens a qualquer solicitação; o Manutentor somente a uma solicitação atribuída a ele.  CA-02: Apenas bens ativos cadastrados podem ser escolhidos, permitindo um ou mais vínculos sem duplicação. CA-03: O vínculo aparece na solicitação e no histórico do bem; removê-lo não exclui nenhum registro. |
|  |

| \[US-029\] Consultar histórico do bem |
| :---- |
| **Ator:** Gestor / Manutentor |
| **Prioridade:** Essencial |
| **História:** Como Gestor ou Manutentor, quero visualizar as solicitações e manutenções associadas a um bem, para conhecer seu histórico. |
| **Critérios de aceitação:**  CA-01: Gestor e Manutentor podem consultar o histórico de um bem com as solicitações associadas, suas datas, assuntos e status. CA-02: O histórico é somente leitura e cada solicitação só pode ser aberta quando o usuário possui permissão. CA-03: Os registros continuam disponíveis mesmo após o arquivamento do bem. |
|  |

| \[US-030\] Gerar relatório interno |
| :---- |
| **Ator:** Gestor  |
| **Prioridade:** Importante |
| **História:** Como Gestor, quero filtrar dados e visualizar indicadores e gráficos simples, para avaliar o processo de manutenção dentro do FixIt. |
| **Critérios de aceitação:** CA-01: Gestor pode filtrar os dados por período, categoria, setor, status e patrimônio. CA-02: O sistema deve apresentar indicadores e gráficos simples com totais por status e categoria, frequência dos problemas e tempo médio de atendimento/conclusão. CA-03: Os dados filtrados devem ser exibidos de forma clara e permitir a impressão utilizando a função de impressão do navegador. |
|  |

## **5\. Representação da Arquitetura Inicial do Software** {#5.-representação-da-arquitetura-inicial-do-software}

### **5.1 Visão Lógica e Padrões** {#5.1-visão-lógica-e-padrões}

O FixIt utiliza Arquitetura em Camadas, dividido em duas macro camadas com dependência unidirecional: a camada de negócio depende da camada de serviço.

| Camada | Conteúdo | Módulos |
| :---- | :---- | :---- |
| Aplicação Específica (pacotes de análise) | Regras de negócio do domínio FixIt | Gerenciamento de Solicitações, Controle Patrimonial, Relatórios/Análises, Acompanhamento de Progresso |
| Aplicação Geral (pacotes de serviço) | Serviços utilitários transversais e reutilizáveis | Autenticação, Validação de Dados, Persistência |

Essa separação garante alta coesão, baixo acoplamento e facilita a substituição futura de tecnologia, por exemplo, trocar o mecanismo de persistência sem alterar as regras de negócio.

#### **5.1.1 Padrão BCE (Boundary-Control-Entity)** {#5.1.1-padrão-bce-(boundary-control-entity)}

Cada caso de uso é modelado internamente em três tipos de classe:

* Boundary — telas/interfaces (ex.: SolicitacaoUI, GerenciamentoPatrimonioUI) que capturam dados do usuário e exibem retornos.

* Control: controladores e serviços que orquestram o fluxo na aplicação cliente via SDK do Supabase (ex.: SolicitacaoController, AutenticacaoServico), validando dados e delegando regras de segurança e persistência diretamente para o Supabase Auth, políticas de RLS (Row Level Security) e banco de dados PostgreSQL.

* Entity — classes de domínio que encapsulam dados e regras de integridade e persistência (ex.: Solicitacao, BemPatrimonial).

Padrões complementares aplicados sobre o BCE:

* Singleton — para AutenticacaoServico e PersistenciaService, garantindo instância única de controle de sessão e de conexão com o banco.

* Data Transfer Object (DTO) — para trafegar dados entre boundary e controller sem expor entidades de banco diretamente na camada de apresentação.

#### **5.1.2 Adequação ao Escopo Acadêmico (DEC-001)** {#5.1.2-adequação-ao-escopo-acadêmico-(dec-001)}

Em relação à arquitetura originalmente descrita, os seguintes ajustes de escopo se aplicam à entrega:

* Multiplataforma → aplicação única: em vez de React (desktop/Gestor) \+ Flutter (mobile/Cliente) separados, o FixIt será entregue como uma única aplicação web responsiva, atendendo todos os papéis em desktop e mobile pelo navegador.

* Sem integração institucional: todos os dados (usuários, solicitações, patrimônio) são cadastrados e mantidos exclusivamente no FixIt, sem Servidor Institucional, Banco Institucional ou sincronização externa.

* Sem canais externos de notificação: recuperação de senha por e-mail, 2FA, e-mail, SMS, WhatsApp e push estão fora do escopo; notificações ocorrem somente dentro do sistema.

* Sem BI avançado: relatórios (US-030) trazem indicadores e filtros simples internos, sem exportadores dedicados ou ferramentas de Business Intelligence.

* Sem requisitos de infraestrutura empresarial: alta disponibilidade, SLA 24/7, escala empresarial e recuperação de desastre não se aplicam a uma entrega acadêmica.

### **5.2 Visão de Desenvolvimento e Física** {#5.2-visão-de-desenvolvimento-e-física}

A Visão de Desenvolvimento é representada por um Diagrama de Componentes: componentes de negócio (que implementam os módulos de análise da camada específica) consomem componentes de serviço compartilhado (autenticação, validação, persistência).

#### **5.2.1 Tecnologias escolhidas** {#5.2.1-tecnologias-escolhidas}

| Camada | Tecnologia | Justificativa |
| :---- | :---- | :---- |
| Backend & BaaS | Supabase | Plataforma Serverless / Backend-as-a-Service que fornece banco de dados PostgreSQL gerido, autenticação integrada, armazenamento de arquivos e APIs automatizadas |
| Frontend (único, responsivo) | React | Aplicação web única e responsiva, atendendo Cliente, Manutentor e Gestor em desktop e mobile  |
| Banco de dados | PostgreSQL | Incluso e totalmente gerido no ambiente Supabase, com suporte nativo a Row Level Security \- RLS e garantias ACID |

**5.2.4 Diagrama de Componentes**

			Imagem 01: Diagrama de componentes

#### **5.2.3 Topologia de implantação (Visão Física)** {#5.2.3-topologia-de-implantação-(visão-física)}

| Nó físico | Responsabilidade |
| :---- | :---- |
| Navegador (Desktop/Mobile) | Aplicação web única em React, responsiva, acessada por Cliente, Manutentor e Gestor. Concentra abertura/acompanhamento de solicitações e telas de gestão, comunicando-se diretamente via SDK do Supabase |
| Nuvem / Internet | Meio de comunicação entre o navegador e a infraestrutura do FixIt, sempre por canais protegidos (HTTPS/TLS). |
| Supabase Cloud (BaaS) | Infraestrutura gerenciada que centraliza o Supabase Auth (gestão de usuários), o PostgreSQL (armazenamento de dados com RLS) e o Supabase Storage (gestão de anexos e arquivos). |

**5.2.4 Diagrama de implantação** 

			Imagem 02:Diagrama de implantação  

Interfaces de comunicação: HTTPS/WSS entre o navegador e os serviços do Supabase (garantindo confidencialidade e integridade de credenciais e dados); APIs REST/GraphQL instantâneas fornecidas pelo Supabase SDK integradas diretamente ao frontend React.

Justificativa: a utilização de uma plataforma BaaS (Backend-as-a-Service) centraliza a infraestrutura de autenticação, armazenamento e banco de dados de forma segura. Embora o cliente interaja com os serviços do Supabase, o acesso direto aos dados e tabelas do PostgreSQL é estritamente controlado e blindado por políticas de Row Level Security (RLS) e regras definidas no servidor, assegurando que cada usuário acesse apenas o que lhe é permitido pelo seu papel.

.

## **6\. Backlog do Produto** {#6.-backlog-do-produto}

| ID | Épico | História Resumida | Prioridade |
| :---- | :---- | :---- | :---- |
| US-001 | Usuários e Acesso | Autocadastrar Cliente (nome, e-mail, senha, matrícula, setor) | Essencial |
| US-002 | Usuários e Acesso | Entrar e sair do sistema com credenciais | Essencial |
| US-004 | Usuários e Acesso | Gestor gerencia papéis de usuário (Cliente/Manutentor/Gestor) | Essencial |
| US-005 | Usuários e Acesso | Restringir ações e dados por papel (RBAC) | Essencial |
| US-003 | Usuários e Acesso | Consultar e editar perfil e senha | Importante |
| US-006 | Solicitações do Cliente | Cliente inicia solicitação de manutenção/dano | Essencial |
| US-007 | Solicitações do Cliente | Detalhar solicitação (local, categoria, descrição etc.) | Essencial |
| US-008 | Solicitações do Cliente | Anexar imagens/PDF como evidência | Essencial |
| US-009 | Solicitações do Cliente | Enviar solicitação (status Pendente) | Essencial |
| US-010 | Solicitações do Cliente | Consultar minhas solicitações (Cliente) | Essencial |
| US-011 | Solicitações do Cliente | Visualizar detalhes e histórico da própria solicitação | Essencial |
| US-012 | Solicitações do Cliente | Notificações internas por evento relevante | Importante |
| US-013 | Gestão e Execução | Listar solicitações agrupadas por status (Gestor/Manutentor) | Essencial |
| US-015 | Gestão e Execução | Visualizar detalhes administrativos da solicitação | Essencial |
| US-016 | Gestão e Execução | Aprovar ou descartar solicitação Pendente | Essencial |
| US-017 | Gestão e Execução | Definir prioridade da solicitação aprovada | Essencial |
| US-018 | Gestão e Execução | Definir setor e Manutentor responsáveis | Essencial |
| US-019 | Gestão e Execução | Manutentor consulta suas atribuições | Essencial |
| US-020 | Gestão e Execução | Atualizar status da solicitação (transições) | Essencial |
| US-021 | Gestão e Execução | Registrar execução e observações | Essencial |
| US-023 | Gestão e Execução | Preservar histórico de mudanças da solicitação | Essencial |
| US-014 | Gestão e Execução | Filtrar e ordenar solicitações | Importante |
| US-022 | Gestão e Execução | Dashboard Kanban por status (Gestor) | Importante |
| US-024 | Gestão e Execução | Arquivar (exclusão lógica) solicitação | Importante |
| US-025 | Patrimônio | Cadastrar bem patrimonial | Essencial |
| US-026 | Patrimônio | Consultar bens patrimoniais | Essencial |
| US-027 | Patrimônio | Editar ou arquivar bem patrimonial | Essencial |
| US-028 | Patrimônio | Vincular bem à solicitação | Essencial |
| US-029 | Patrimônio | Consultar histórico do bem | Essencial |
| US-030 | Relatórios | Gerar relatório interno com indicadores e filtros | Importante |

## 

## **7\. Planejamento da Sprint 1** {#7.-planejamento-da-sprint-1}

Duração: 2 semanas

Foco: núcleo de acesso e abertura de chamados do Cliente (parte do MVP: cadastro, autenticação e criação básica de solicitações).

### **7.1 Objetivo da Sprint** {#7.1-objetivo-da-sprint}

“Permitir que um Cliente crie sua conta, autentique-se com segurança e registre e acompanhe suas próprias solicitações de manutenção, entregando o núcleo funcional do MVP do FixIt.”

### **7.2 Backlog da Sprint 1** {#7.2-backlog-da-sprint-1}

|  | História | Por que está nesta Sprint |
| ----- | :---- | :---- |
| 1 | US-001 — Autocadastrar Cliente | Base de acesso ao sistema |
| 2 | US-002 — Entrar e sair do sistema | Autenticação essencial para todas as demais ações |
| 3 | US-005 — Restringir ações e dados por papel | Garante que o Cliente veja apenas seus próprios dados desde o início |
| 4 | US-006 — Criar solicitação de manutenção | Núcleo da abertura de chamado |
| 5 | US-007 — Detalhar solicitação | Completa os dados mínimos da solicitação |
| 6 | US-008 — Anexar evidências à solicitação | Parte do fluxo básico de criação |
| 7 | US-009 — Enviar solicitação | Fecha o ciclo de criação (status Pendente) |
| 8 | US-010 — Consultar minhas solicitações | Permite ao Cliente ver o que criou |
| 9 | US-011 — Visualizar detalhes e histórico da solicitação | Fecha o ciclo de acompanhamento básico |

Ficam fora da Sprint 1, por dependerem de fluxos de Gestor/Manutentor ainda não implementados, US-004 e US-012 a US-024, além de todo o épico de Patrimônio (US-025 a US-029) e o de Relatórios (US-030). São candidatos naturais para a Sprint 2\.

### **7.3 Definition of Done (DoD), critérios básicos desta etapa** {#7.3-definition-of-done-(dod),-critérios-básicos-desta-etapa}

1. Funcionalidade implementada conforme os critérios de aceitação (CA) da respectiva US.

2. Código revisado por pelo menos um outro integrante da equipe (code review).

3. Testes unitários mínimos cobrindo os fluxos principais e de erro (ex.: dados inválidos, e-mail duplicado, credenciais incorretas).

4. Endpoints da API documentados (ex.: Swagger/OpenAPI) e testados manualmente ou via testes automatizados.

5. Senhas armazenadas com hash, nunca em texto plano.

6. Build sem erros e sem warnings críticos; aplicação executando no ambiente de desenvolvimento sem falhas.

7. Item validado no ambiente de testes pelo Product Owner/professor responsável antes de ser considerado "Concluído".

