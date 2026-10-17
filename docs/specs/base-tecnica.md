# SPEC-001 — Base técnica executável do FixIt

Status: **ready-for-agent**. Grill encerrado em 2026-10-17, incluindo CI/CD e guia da equipe. Especificação ainda não implementada.

## Problem Statement

João, Paulo e Rebeca precisam desenvolver a Sprint 1 com identidade, dados, autorização e configuração compatíveis. O repositório tem documentação e automação de etiquetas, mas ainda não tem aplicação executável, banco reproduzível ou CI/CD da aplicação. Falta também orientar Rebeca e Paulo sobre ferramentas, skills e conexões pessoais, que não são compartilhadas pelo Git.

## Solution

Entregar Next.js local conectado ao Supabase local/cloud gratuito, com esquema mínimo, Auth, RLS, migrations, contratos e dados de teste. CI verifica a base; CD aplica migrations no cloud após integração na principal e CI aprovado do mesmo commit. Um guia atualizado permite configurar ferramentas, skills, conexões e executar as verificações. As telas completas permanecem nas histórias de produto.

## User Stories

Necessidades da preparação; não substituem nem criam identificadores US de produto.

1. Como desenvolvedor, quero instalar dependências com versões fixadas e lockfile, para reproduzir o ambiente da equipe.
2. Como desenvolvedor, quero iniciar o Next.js localmente, para verificar que a aplicação inicial executa.
3. Como desenvolvedor, quero iniciar meu Supabase local, para desenvolver sem alterar os dados dos colegas.
4. Como desenvolvedor, quero preparar o banco a partir de migrations, para reconstruir sua estrutura sem passos SQL ocultos.
5. Como desenvolvedor, quero escolher explicitamente entre Supabase local e cloud, para saber onde meus comandos leem e gravam.
6. Como equipe, queremos um único projeto cloud gratuito, para integrar e demonstrar o trabalho sem custo obrigatório.
7. Como João, quero um contrato de identidade compartilhado, para integrar autenticação com as outras frentes.
8. Como desenvolvedor, quero contas reais de teste do Auth, para validar sessões sem atalhos de identidade.
9. Como Cliente de teste, quero meu perfil associado à identidade autenticada, para manter autoria e dados pessoais coerentes.
10. Como equipe, queremos que autocadastros gerem somente Clientes, para impedir que dados enviados pelo navegador concedam privilégios.
11. Como equipe, queremos matrícula textual única, para preservar zeros iniciais e rejeitar duplicatas equivalentes.
12. Como desenvolvedor, quero setores e categorias de teste compartilhados, para preencher relações consistentes.
13. Como Paulo, quero o contrato de solicitação com campos e validações documentados, para implementar criação e envio compatíveis com a consulta.
14. Como Paulo, quero autoria, data e estado inicial definidos no servidor/banco, para impedir sua escolha arbitrária pelo navegador.
15. Como equipe, queremos solicitação e evento inicial consistentes, para impedir registros parciais na criação.
16. Como Rebeca, quero exemplos persistidos de dois Clientes, para implementar leitura e isolamento sem esperar o formulário completo.
17. Como Rebeca, quero contratos de listagem e detalhe definidos, para desenvolver consultas com resultados previsíveis.
18. Como Cliente de teste, quero acesso somente às minhas solicitações e históricos, para preservar o isolamento mesmo no acesso direto à API.
19. Como Cliente de teste, quero que acesso a um registro alheio não revele sua existência, para preservar a privacidade.
20. Como desenvolvedor, quero um contrato cronológico de histórico, para integrar o evento de criação e futuras alterações.
21. Como equipe, queremos testar regras na fronteira real com Auth e PostgreSQL, para detectar falhas que mocks de clientes ocultariam.
22. Como autor de PR, quero lint, tipos, build e integração no CI, para receber feedback antes da integração.
23. Como revisor, quero critérios de aceite e evidências, para avaliar a base e os impactos das migrations.
24. Como equipe, queremos CD de migrations no push para a principal após CI aprovado, para manter o cloud alinhado ao código integrado.
25. Como equipe, queremos preservar dados e impedir deploys concorrentes, para que a automação não resete o ambiente compartilhado.
26. Como desenvolvedor, quero dados fictícios reproduzíveis também no cloud, para testar e demonstrar sem uso real do sistema.
27. Como Rebeca ou Paulo, quero instruções de instalação das skills com sua origem, para configurar meu agente sem copiar a máquina de João.
28. Como Rebeca ou Paulo, quero instruções e testes das conexões Trello, Drive, GitHub e Supabase, para confirmar acesso com minha própria conta.
29. Como desenvolvedor, quero instruções para preparar ambiente, rodar verificações e iniciar meu cartão, para começar sem depender de explicações por mensagem.
30. Como equipe, queremos distinguir configuração escrita de automação funcionando, para somente declarar a base pronta após execução verificada.

## Implementation Decisions

### Arquitetura e organização

- Next.js responsivo com App Router, TypeScript, npm e CSS Modules. Fixar versões compatíveis do runtime e dependências, incluindo CLI Supabase, com lockfile.
- Operações de dados passam pelo servidor Next.js e API REST do Supabase com identidade do usuário; sessão em cookies via integração SSR. RLS e permissões SQL protegem também acesso direto à API.
- BCE como responsabilidades de interface, coordenação e domínio/dados, sem classes ou Singleton obrigatórios. Contratos documentados, sem exigir Swagger ou REST adicional no Next.js.
- Preparar configuração, identidade, validação, persistência e contratos compartilhados da Sprint 1. A aplicação inicial comprova execução e conexão.

### Ambientes e acesso

- Supabase local por pessoa, com PostgreSQL, Auth, API e Storage em runtime compatível com Docker.
- Um cloud `fixit-dev` na organização `clpjmmkrnnuvvuwrhrgh`, gratuito, São Paulo se disponível. Checar cota, região e cotação antes de criar; nenhum gasto autorizado. Integração e demonstração compartilham dados, sem uso real previsto.
- Next.js local; ambiente distingue local/cloud. Credenciais administrativas e secrets não são públicos. Conexões pessoais do agente não autenticam automaticamente CLI ou GitHub Actions.

### Identidade, perfil e referências

- Perfil e identidade Auth compartilham UUID. Contrato de sessão: identificador e papel, validados no servidor.
- Perfil contém nome, matrícula, setor e papel. E-mail/senha pertencem ao Auth; evitar autoridade duplicada para credenciais.
- Cadastro requer nome, e-mail, senha, matrícula e setor. E-mail e matrícula são únicos; senha possui ao menos oito caracteres. Matrícula é texto, preserva zeros iniciais, remove espaços nas pontas e tem unicidade sem distinguir maiúsculas/minúsculas; não há consulta institucional ou formato institucional imposto.
- Autenticação por e-mail/senha sem confirmação por e-mail, tanto localmente quanto no cloud. Não comprova a posse do endereço; recuperação por e-mail e login externo ficam excluídos.
- Autocadastro concede somente Cliente. Papel fica protegido no banco e não pode ser alterado pelo navegador ou por metadados editáveis do usuário. Gestor e Manutentor iniciais são preparados por procedimento administrativo documentado, sem implementar ainda a tela de gestão de papéis.
- Setores e categorias são referências cadastradas no banco, com valores fictícios iniciais. Setor do usuário e futuro setor responsável pelo atendimento têm significados distintos. Administração dessas referências pela interface fica para depois.

### Solicitação e histórico inicial

- Esquema mínimo: perfis, setores, categorias, solicitações e histórico inicial, com relações, unicidade, campos obrigatórios e acesso protegido. Não materializar todas as dez tabelas do desenho histórico nesta preparação.
- Contratos devem registrar nomes, tipos, nulabilidade, validações e exemplos de identidade, cadastro/perfil, envio, listagem, detalhe e histórico, em formatos consumíveis pelas três frentes.
- Solicitação exige local, categoria, assunto e descrição. Motivo, pessoas/áreas afetadas, frequência, tipo de utilização, riscos e patrimônios afetados são textos opcionais. Local é texto livre; categoria aponta para referência válida; patrimônio afetado é descrição livre, sem vínculo formal com inventário nesta etapa.
- Autoria vem da identidade autenticada; data/hora do envio é gerada no servidor/banco; estado inicial é Pendente. Cliente não controla prioridade, setor responsável ou Manutentor.
- Registro da solicitação e evento inicial de criação devem ser consistentes e atômicos. Histórico contém identificação da solicitação, data, autor, descrição e estado novo; o estado anterior não existe na criação. Preparar regras mínimas e exemplos para testar essa integridade, deixando mudanças administrativas futuras para suas histórias.
- Listagem de solicitações próprias: páginas de 20 itens, mais recentes primeiro, com identificação, assunto, categoria, data e status. Documentar desempate determinístico na implementação.
- Detalhe e histórico pertencem ao mesmo conjunto autorizado. Histórico é cronológico e somente leitura para Cliente. Registro inexistente e registro de outro Cliente têm a mesma resposta de não encontrado.
- RLS e permissões protegem solicitações, perfis e histórico. Papéis de teste não antecipam consultas/transições administrativas.

### Dados de teste e migrations

- Preparar duas contas Cliente, uma Manutentor e uma Gestor com Auth real e dados fictícios, localmente e no cloud. Exemplos de solicitações e eventos permitem testar consulta e isolamento sem telas completas.
- Rotina documentada e reproduzível de preparação dos dados; sua repetição não depende de criar contas manualmente no painel. No cloud, preservar registros existentes e evitar duplicar a carga de teste ao reaplicar sua preparação.
- Migrations versionadas são a fonte da estrutura compartilhada. Cada frente evolui sua parte em migrations próprias, sem editar migrations integradas ou dos colegas. Corrigir por novas migrations.
- A preparação não sincroniza automaticamente dados locais com cloud e não executa resets destrutivos remotos. Configuração inicial de Auth é entregue e verificada separadamente da aplicação das migrations.

### Trabalho da equipe e CI/CD

- Branch por tarefa, PR para `main`, revisão de um colega e CI obrigatório. Preservar a divisão de João, Paulo e Rebeca e a rastreabilidade dos cartões existentes.
- CI em PR e push para a principal: instalação reproduzível, lint, TypeScript, build e testes de integração com a stack Supabase local completa, incluindo Auth e API.
- CD de migrations no push para `main`, condicionado ao CI aprovado do mesmo commit. Provisionar o projeto e configurar acessos antes do primeiro CD; aplicar migrations após integração pelo fluxo aprovado.
- Aplicar somente migrations pendentes, impedir deploys simultâneos e preservar dados existentes. Não incluir reset remoto no deploy. Dados de teste têm rotina própria; migrations futuras também precisam ser revisadas quanto ao efeito sobre dados existentes.
- Deploy usa secrets do GitHub e exige execução verificada. O CD não publica Next.js.
- Habilitar checks/revisão na proteção da branch se permitido; registrar impedimentos, distinguindo convenção de proteção ativa.

### Entrada de Rebeca e Paulo

- Entregar guia de ferramentas locais e instalação das skills, com origem e instruções reproduzíveis, sem caminhos pessoais de outro desenvolvedor.
- Explicar instalação/conexão dos plugins ou MCPs de Trello, Google Drive, GitHub e Supabase, acessos pessoais necessários e consultas de leitura para verificar cada conexão.
- Documentar versões efetivamente usadas, instalação de dependências, preparação do banco e contas de teste, configuração de ambiente, execução da aplicação e de todas as verificações. Atualizar o guia inicial existente com comandos reais antes do aceite.
- Incluir leitura das decisões, glossário e ADRs, responsabilidades, contrato compartilhado, consulta do cartão e bloqueadores no Trello, fluxo de branch/PR e checklist de prontidão.

## Testing Decisions

Fronteira aprovada no grill: integração real dos contratos entre servidor/cliente autenticado, Auth/API e PostgreSQL. Testar comportamento observável, evitando mocks que reproduzem implementação e testes de cada helper. Não há testes anteriores da aplicação; a automação existente apenas sincroniza etiquetas.

- **Execução:** instalação limpa com lockfile, aplicação local, configuração local/cloud, build e conexão; diagnosticar configuração ausente sem expor secrets.
- **Banco:** migrations desde banco local vazio, referências e dados reproduzíveis; verificar relações, unicidade e obrigatoriedade.
- **Auth/perfil:** sessões reais, identidade/perfil coerentes, cadastro Cliente, bloqueio de elevação de papel, matrícula equivalente duplicada e credenciais inválidas.
- **Isolamento:** dois Clientes acessam API e histórico; bloquear dados alheios, autoria forjada e eventos fabricados. Sem sessão válida não há dados protegidos.
- **Criação:** Pendente, autor e data corretos, evento inicial consistente; falhas não deixam registros parciais. Recusar obrigatórios vazios e referências inexistentes.
- **Consulta:** contratos verificam páginas de 20, ordenação estável, vazio, detalhe permitido e mesma resposta para inexistente/alheio. Histórico cronológico e autorizado. Jornadas completas ficam nas histórias.
- **CI/CD:** evidenciar CI e deploy do mesmo commit; reaplicar sem migrations pendentes e preservar dados; CI falho bloqueia CD; dois deploys não ficam ativos simultaneamente.
- **Cloud:** conexão, Auth, migrations e dados de teste verificados com sessões reais. Testes destrutivos somente no local descartável.
- **Guia:** links e comandos reais verificados, preparação executada em ambiente limpo, conexões/permissões verificadas registradas. Workflows escritos sem execução não bastam.

## Out of Scope

- Telas e jornadas completas de cadastro, login/logout, criação/envio e consultas, que continuam nas histórias da Sprint 1. A base inclui integração e regras mínimas suficientes aos testes, sem encerrar essas histórias.
- Gestão de papéis e referências pela interface; aprovar, priorizar, atribuir, executar ou concluir solicitações; histórico completo de alterações administrativas.
- Anexos e buckets de aplicação, notificações, inventário e vínculo formal de bens, relatórios e Kanban. A stack local pode incluir Storage sem implementar anexos.
- Publicar ou hospedar o Next.js, disponibilizar o produto para uso real, criar ambientes cloud adicionais ou contratar serviços pagos.
- Confirmação/recuperação por e-mail, login social/institucional, integrações institucionais, notificações externas e aplicativo separado.
- Requisitos empresariais como alta disponibilidade, SLA e recuperação de desastre.
- Redistribuir responsáveis, modificar estimativas ou declarar os cartões existentes concluídos por entregar a base.

## Further Notes

- [DEC-001](https://trello.com/c/iQhgWOan) e [DEC-002](https://trello.com/c/sA10ilUi) foram relidas ao vivo. O grill prevalece em conflitos: Supabase gerenciado é infraestrutura permitida; Next.js/Supabase substituem Spring Boot/React/Flutter separados.
- Relidos: [S1-J01](https://trello.com/c/x3tAilqC), [S1-P01](https://trello.com/c/NO7qMjHP), [S1-R01](https://trello.com/c/OaAB6z5B). Preservar João em usuários/autenticação, Paulo em criação/envio e Rebeca em consulta/autorização; explicitar sobreposições ao desdobrar. Conferir atribuições divergentes antes de implementar.
- Supabase autenticado; consulta inicial sem projetos. Reconsultar antes de criar. Esta publicação não provisiona recursos.
- Pendências: runtime de containers ausente no PATH; conta GitHub consultada somente leitura. Secrets, publicação, proteção e CD dependem de acesso adequado; configuração local pode avançar.
- Aceite exige aplicação, banco, contratos, isolamento, guia e CI/CD verificados. Registrar impedimentos sem declarar entrega concluída.
- Não há nova estimativa aprovada; a hora de preparação dos cartões S1 não estima automaticamente esta base.
- `ready-for-agent` está registrado em texto: a etiqueta visual não existe no board e o conector não permite criá-la. Etiquetas existentes de produto permanecem preservadas.
