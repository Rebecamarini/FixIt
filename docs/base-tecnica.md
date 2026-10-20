# Preparação da base técnica

Registro da entrevista iniciada em 2026-10-17. O usuário confirmou seu encerramento ao solicitar os próximos passos pelo ask-matt. As decisões abaixo orientam a preparação; não há implementação concluída por esse fechamento.

## Decisões confirmadas — rodada 1

- Next.js e Supabase gerenciado são a arquitetura vigente, conforme o [ADR 0001](adr/0001-nextjs-supabase.md).
- Nenhum gasto obrigatório com serviços; aceitar e documentar as limitações decorrentes desse teto.
- A base deve entregar aplicação inicial executável, conexão verificável ao Supabase, configuração reproduzível, contratos da Sprint 1, migrations e dados de teste mínimos, verificações no CI e instruções para os três desenvolvedores.
- Cadastro/login, formulário e consultas completos permanecem nas tarefas do produto. O esquema compartilhado mínimo necessário à preparação será definido nesta entrevista.

## Decisões confirmadas — rodada 2

- Q5: operações de dados da aplicação pelo servidor Next.js, usando a identidade do usuário, sessão em cookies e `@supabase/ssr`, com RLS no banco. A API REST gerada pelo Supabase continua sendo utilizada; não é exigida uma API REST adicional no Next.js para uso interno.
- Q4: Supabase local por pessoa, incluindo PostgreSQL, Auth, API e Storage, e um único cloud gratuito compartilhado para integração e demonstração. Não há outro cloud separado para testes ou produção; alterações compartilhadas podem afetar a demonstração. Estrutura é compartilhada via migrations; dados locais não são sincronizados automaticamente.
- Q6: BCE adaptado às responsabilidades do Next.js/Supabase, sem exigir classes ou Singleton de sessão. Aproveitar a API REST gerada pelo Supabase e documentar contratos sem exigir Swagger ou API REST adicional no Next.js. A dúvida sobre exigência acadêmica vinha dos documentos do próprio projeto; não foi encontrada exigência separada do professor. O usuário autorizou atualizar a documentação do projeto.

## Decisões confirmadas — rodada 3

- Q7: cadastro por e-mail e senha sem confirmação por e-mail no local e no cloud. A posse do endereço informado não é verificada; recuperação por e-mail permanece fora do escopo.
- Q8: preparar dois Clientes, um Manutentor e um Gestor com identidades reais do Supabase Auth e dados fictícios reproduzíveis. O usuário autorizou essas contas e testes também no cloud: o objetivo atual é desenvolvimento e demonstração, sem disponibilização para uso real. Novos autocadastros continuam criando somente Clientes; concessão de outros papéis ocorre por procedimento administrativo.
- Q9: o usuário possui a organização `clpjmmkrnnuvvuwrhrgh`, mas informou ainda não haver projeto FixIt nela. Solicitou capacidade de operação do Supabase pelo agente, incluindo criação do projeto. A conexão e a configuração do projeto ainda serão preparadas; não há credenciais recebidas nem recurso cloud criado nesta sessão.

## Decisões confirmadas — rodada 4

- Q10: criar o projeto `fixit-dev` na organização informada, no plano gratuito, escolhendo São Paulo se disponível. Verificar região e cota antes da criação.
- Q11: preparar apenas o esquema necessário à Sprint 1: perfis, solicitações, histórico inicial e referências necessárias, com RLS e dados de teste. Tabelas de anexos, notificações, execução e inventário ficam para as respectivas tarefas futuras.

## Decisões confirmadas — rodada 5

- Q12: Next.js com App Router, TypeScript, npm e CSS Modules.
- Q13: categorias e setores em tabelas de referência, inicialmente com dados fictícios de teste. Cliente seleciona setor no cadastro e categoria na solicitação; local do problema é texto livre. Administração dessas listas pela interface fica fora da preparação.
- Q14: branch por tarefa e PR para a principal, revisão de um colega e CI obrigatório. Migrations no cloud somente após integração; migrations integradas não são editadas, sendo corrigidas por novos arquivos.
- Q15: Next.js executado no computador de cada pessoa, configurável para Supabase local ou cloud. Publicação de endereço web fica para depois da preparação.

## Decisões confirmadas — rodada 6

- Q16: o UUID do Supabase Auth também identifica o perfil do FixIt. Contrato compartilhado de identidade autenticada: `{ id, papel }`. Nome, matrícula e setor pertencem ao perfil; senha é gerenciada pelo Auth. O papel fica em campo protegido no banco, usado pelo servidor e pelas regras de acesso, sem confiar em valores editáveis enviados pelo navegador.
- Q17: matrícula é texto obrigatório e único, preservando zeros iniciais. Remover espaços nas pontas e comparar sem distinguir maiúsculas/minúsculas. Não consultar sistemas institucionais nem impor formato institucional. Nome obrigatório, e-mail único e senha mínima de oito caracteres permanecem conforme US-001.
- Q18: local, categoria, assunto e descrição são obrigatórios; motivo, pessoas/áreas afetadas, frequência, tipo de utilização, riscos e patrimônios afetados são textos opcionais. Data/hora são geradas no servidor no envio; patrimônio afetado é descrição livre, sem vínculo formal com inventário nesta etapa. Autoria vem da sessão e status inicial é Pendente; Cliente não define prioridade nem responsáveis.

## Decisões confirmadas — rodada 7

- Q19: listagem das próprias solicitações em páginas de 20 itens, da mais recente para a mais antiga; resumo com identificação, assunto, categoria, data e status. Histórico em ordem cronológica. Detalhe inexistente ou pertencente a outro Cliente tem a mesma resposta de não encontrado, sem revelar a existência de registro alheio.
- Q20: documentar instalação e execução; exigir lint, TypeScript, build e testes de integração com Supabase local no CI. Verificar migrations desde banco vazio, sessões reais de teste, isolamento entre dois Clientes, papel protegido, validações do banco e consistência do evento inicial. No cloud, verificar conexão e dados de teste. Telas e jornadas completas permanecem nas histórias do produto.
- Complemento do usuário: deixar CI/CD preparado para quem desenvolver. Em PR, executar CI; no push para `main`, aplicar migrations automaticamente no cloud após sucesso das verificações do mesmo commit. O CD deve preservar os dados existentes e impedir deploys simultâneos. Dados de teste têm preparação reproduzível, sem reset destrutivo no deploy. Publicação do Next.js continua fora desta etapa.

## Acesso ao Supabase verificado

Em 2026-10-17, a conexão do plugin Supabase foi confirmada por consultas autenticadas: organização `clpjmmkrnnuvvuwrhrgh` (`Junior's Org`), plano `free`; a listagem de projetos retornou vazia. Há ferramentas para consultar projetos, criar projeto, executar SQL e aplicar migrations. Nenhum projeto foi criado nessa verificação; as demais permissões não foram exercitadas.

## Restrições existentes

A [DEC-002](https://trello.com/c/sA10ilUi), consultada ao vivo em 2026-10-17, mantém João responsável por usuários/autenticação, Paulo por criação/envio e Rebeca por consulta/autorização. Integração com sessão real e autorização no servidor é obrigatória para aceite. Anexos e notificações ficam para sprints futuras; o histórico inicial registra a criação.

Contratos e preparação se relacionam aos cartões [S1-J01](https://trello.com/c/x3tAilqC), [S1-P01](https://trello.com/c/NO7qMjHP) e [S1-R01](https://trello.com/c/OaAB6z5B), também consultados ao vivo. Esta entrevista não encerra esses cartões nem redistribui as frentes.

## Fechamento da entrevista e execução pendente

Entrevista encerrada pelo usuário, com decisões consolidadas. A [SPEC-001](https://trello.com/c/vWo76DXs) foi publicada no Trello em Pronto para Implementação, com [cópia local](specs/base-tecnica.md). O usuário aprovou a divisão em sete cartões BT, publicados com [links e dependências](specs/base-tecnica-tickets-proposta.md). O próximo passo é implementar por dependências, começando pelo [BT-001](https://trello.com/c/n4BRJlnF). O aceite da preparação abrange:

1. Aplicação Next.js inicial executável localmente, com TypeScript, App Router, npm e CSS Modules, sem as telas completas das histórias.
2. Configuração reproduzível do Supabase local e projeto cloud `fixit-dev` gratuito na organização indicada, região São Paulo se disponível; checar custo e disponibilidade antes de criar.
3. Migrations versionadas para o esquema mínimo, Auth configurado, RLS, dados de teste reais e exemplos dos contratos aprovados. Incluir as invariantes de banco necessárias aos testes, incluindo autoria, status inicial e evento inicial consistente, sem antecipar o fluxo administrativo futuro.
4. Contratos documentados de identidade, cadastro/perfil, envio, listagem, detalhe e histórico. Preparar funções/infraestrutura compartilhadas e exemplos para as frentes, sem declarar encerradas as histórias completas de cadastro, login, criação ou consulta.
5. CI em PR e push para `main`; CD de migrations para o cloud somente após CI aprovado no mesmo commit. Configurar e verificar secrets, promoção e logs de execução sem publicar credenciais. Provisionamento do projeto e configuração inicial antecedem o primeiro CD; migrations do cloud seguem o fluxo de integração aprovado.
6. Instruções para os três desenvolvedores, comandos únicos para as verificações, configuração de ambiente e procedimento de atualização do banco. Preservar a divisão das frentes e revisão por colega; verificar permissões do GitHub para saber se a proteção de branch pode ser aplicada.

Complemento solicitado após o grill: entregar documentação de entrada para Rebeca e Paulo, incluindo origem/instalação das skills, conexão dos plugins/MCPs, permissões pessoais, ferramentas locais, configuração da aplicação e verificação de prontidão. O [guia de início da equipe](inicio-equipe.md) já cobre o estado atual e deve ser atualizado com os comandos e configurações reais antes de concluir a base. Essa documentação integra os critérios de aceite da preparação.

Pendências operacionais não são decisões de produto abertas: provisionar os recursos, obter as credenciais necessárias ao CI/CD por meio seguro, configurar containers locais (Docker ainda não está disponível no PATH desta sessão), implementar, integrar e executar os checks. O acesso do plugin Supabase foi verificado; ele não fornece automaticamente credenciais ao GitHub Actions.

Consulta autenticada ao GitHub em 2026-10-17 confirmou `main` como branch padrão, repositório público `Rebecamarini/FixIt` e permissões da conta atual: leitura, sem push ou administração. Portanto, publicar a implementação e configurar secrets/proteções depende de autenticação com permissões adequadas ou ação de um responsável autorizado; arquivos locais de workflow por si só não tornam o CD ativo. Acesso Supabase e acesso GitHub são independentes.

## Fontes e limites da leitura

Foram lidos os Trabalhos 01 editado e 02 e o snapshot do backlog em [referências](references/README.md), além dos cartões ao vivo citados. O PDF histórico não foi examinado por indisponibilidade de leitor no ambiente. As cópias importadas são históricas e permanecem preservadas. A decisão do usuário acima resolve o conflito entre Supabase gerenciado e a redação antiga da DEC-001; essa alteração ainda não foi publicada no Trello.
