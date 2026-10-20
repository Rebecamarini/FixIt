# SPEC-001 — Desdobramento aprovado e publicado

Divisão aprovada pelo usuário e publicada no Trello em 2026-10-17. Fonte: [SPEC-001](https://trello.com/c/vWo76DXs), relida ao vivo com seus comentários; o cartão não tinha comentários nem checklists adicionais. Identificadores BT representam tarefas técnicas, não novas histórias US. Os cartões ao vivo são a fonte dos estados atuais; os textos abaixo preservam a divisão aprovada.

| Cartão | Entrega | Bloqueado por |
| --- | --- | --- |
| [BT-001](https://trello.com/c/n4BRJlnF) | Aplicação com Supabase local | Nenhum cartão |
| [BT-002](https://trello.com/c/fTQM6k2t) | Conexão cloud | BT-001 |
| [BT-003](https://trello.com/c/oRtndcsS) | Identidade e papéis | BT-001 |
| [BT-004](https://trello.com/c/MrgSRKFE) | Solicitação e evento inicial | BT-003 |
| [BT-005](https://trello.com/c/m7H2NRnJ) | Consultas e isolamento | BT-004 |
| [BT-006](https://trello.com/c/3W4Ajz0j) | CI/CD e dados cloud | BT-002 e BT-003 |
| [BT-007](https://trello.com/c/iZhZxnWc) | Prontidão da equipe | BT-005 e BT-006 |

Cada entrega inclui implementação, testes do comportamento, contratos/exemplos correspondentes e instruções necessárias para reproduzi-la. A ausência de telas completas do produto é uma restrição da especificação; não deve ser resolvida adicionando jornadas fora de escopo. Nenhuma atribuição, estimativa, movimentação ou conclusão dos cartões existentes está proposta.

## BT-001 — Executar a aplicação com Supabase local

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

Um desenvolvedor prepara as dependências, inicia a stack Supabase local e executa a aplicação Next.js inicial, com conexão verificável e orientação de erros de configuração. Entrega o primeiro caminho executável da base, da aplicação ao serviço local, sem autenticação simulada ou exposição de dados protegidos.

### Acceptance criteria

- [ ] Next.js com App Router, TypeScript, npm e CSS Modules; runtime e dependências compatíveis fixados, com lockfile e CLI Supabase versionada.
- [ ] Configuração Supabase local reproduzível; Auth, API e PostgreSQL funcionam na stack completa em runtime compatível com Docker.
- [ ] Aplicação inicial abre localmente e comprova conexão pelo servidor; configuração ausente ou inválida resulta em diagnóstico sem secrets ou dados protegidos.
- [ ] Exemplo de ambiente e comandos reais permitem instalação limpa, inicialização, lint, checagem de tipos, build e verificação de conexão.
- [ ] Instruções de ferramentas locais e sequência de execução atualizadas no guia da equipe.

### Blocked by

Nenhum cartão. Exige runtime de containers funcional para comprovar o resultado; se faltar, resolver ou registrar impedimento sem declarar execução validada.

## BT-002 — Conectar a aplicação ao cloud gratuito compartilhado

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

A mesma aplicação local consegue selecionar explicitamente o Supabase cloud compartilhado e verificar a conexão. O projeto gratuito é provisionado uma única vez e os acessos são documentados, sem antecipar migrations de negócio antes da integração.

### Acceptance criteria

- [ ] Reconsultar projetos existentes antes de criar `fixit-dev`, na organização indicada pela SPEC-001; verificar plano, cota e cotação sem autorizar gasto.
- [ ] Usar São Paulo se disponível; documentar a região efetivamente usada e limitações relevantes do plano gratuito.
- [ ] Aplicação local alterna entre destino local e cloud por configuração e verifica conexão no destino escolhido.
- [ ] Configuração inicial de Auth usa e-mail/senha sem confirmação por e-mail; separar essa configuração da aplicação de migrations.
- [ ] Acesso do agente e acesso da aplicação verificados separadamente; documentar acesso pessoal da equipe e obtenção segura das configurações.
- [ ] Não publicar Next.js, criar clouds extras ou sincronizar dados locais automaticamente.

### Blocked by

BT-001: aplicação/configuração verificável. Não depende dos contratos de identidade ou solicitações.

## BT-003 — Usar identidades reais com perfis e papéis protegidos

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

As três frentes conseguem obter a mesma identidade autenticada e perfil usando Auth real, integração SSR e regras de banco, sem esperar as telas completas de cadastro/login. O caminho é demonstrado por testes de integração e exemplos de sessão consumíveis pela aplicação.

### Acceptance criteria

- [ ] Migrations de perfil e setores com relações, campos obrigatórios e regras de acesso; UUID do perfil igual ao Auth.
- [ ] Contrato de identificador/papel validado no servidor, com cookies e integração SSR; papel protegido no banco, sem confiar em metadados editáveis.
- [ ] Dados de cadastro e regras compartilhadas documentados: nome, e-mail e matrícula obrigatórios, setor válido, e-mail/matrícula únicos, senha mínima de oito caracteres.
- [ ] Matrícula textual preserva zeros, remove espaços nas pontas e rejeita duplicatas sem distinguir maiúsculas/minúsculas.
- [ ] Autocadastro produz Cliente; identidade e perfil ficam coerentes. Elevação pelo navegador é recusada. Não implementar tela de gestão de papéis.
- [ ] Rotina local reproduzível de dois Clientes, um Manutentor e um Gestor, com contas reais, referências e procedimento administrativo controlado.
- [ ] Testes de sessão real, credenciais inválidas, validações/duplicatas e tentativas de elevação passam localmente; contratos e instruções acompanham a entrega.

### Blocked by

BT-001. Não depende do cloud.

### Relação com cartões existentes

Complementa [S1-J01](https://trello.com/c/x3tAilqC): base e exemplo de identidade para as frentes. João mantém usuários/autenticação e a integração das telas nas histórias US-001/US-002. A entrega não encerra esses cartões automaticamente.

## BT-004 — Persistir uma solicitação de teste com evento inicial atômico

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

Uma sessão Cliente real consegue exercitar a persistência mínima de uma solicitação válida e seu evento inicial, segundo o contrato compartilhado. Regras e exemplos dão à criação e à consulta uma fonte comum, sem implementar o formulário completo.

### Acceptance criteria

- [ ] Migrations de categorias, solicitações e histórico inicial com relações e referências fictícias reproduzíveis.
- [ ] Contrato de campos, tipos, nulabilidade, validação e exemplos publicado conforme SPEC-001; obrigatórios e opcionais respeitados.
- [ ] Identidade real determina autor; servidor/banco determina data/hora e estado Pendente. Cliente não escolhe prioridade ou responsáveis.
- [ ] Persistência mínima e evento inicial são atômicos: falhas não deixam registro parcial. Evento identifica solicitação, data, autor, descrição e novo estado, sem estado anterior na criação.
- [ ] Acesso direto à API não permite autoria forjada ou eventos fabricados; RLS e permissões acompanham as tabelas expostas.
- [ ] Testes locais observam dados válidos, obrigatórios inválidos, referência inexistente, autoria forjada e consistência sob falha.
- [ ] Exemplos e dados de teste são suficientes à consulta; telas completas de criação/envio e transições administrativas continuam fora da entrega.

### Blocked by

BT-003: identidade, perfil, setores e sessões reais.

### Relação com cartões existentes

Complementa [S1-P01](https://trello.com/c/NO7qMjHP), com contrato e regras compartilhadas. Paulo mantém criação/envio e integração do formulário; não duplicar essa interface nem encerrar US-006/US-007/US-009 nesta preparação.

## BT-005 — Verificar consultas e isolamento entre dois Clientes

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

Rebeca consegue desenvolver consultas contra dados reais de teste, com contratos de listagem, detalhe e histórico verificáveis e privacidade garantida na API. A entrega prepara exemplos/integração mínima, sem exigir telas completas de listagem ou detalhe.

### Acceptance criteria

- [ ] Rotina local produz solicitações e eventos para dois Clientes e quantidade suficiente para verificar mais de uma página.
- [ ] Contrato/teste de listagem: 20 itens por página, mais recentes primeiro, desempate determinístico, resumo e estado vazio definidos.
- [ ] Contrato/teste de detalhe e histórico: dados permitidos, cronologia e mesma resposta para registro inexistente ou de outro Cliente.
- [ ] Cliente só consulta suas solicitações e histórico; histórico somente leitura. API direta com sessão de outro Cliente e sem sessão não expõe dados.
- [ ] Testes com sessões reais cobrem isolamento e operações proibidas; sem atalhos locais de identidade no runtime final.
- [ ] Contratos, exemplos de respostas e roteiro local atualizados para a frente de consulta; não antecipar telas administrativas.

### Blocked by

BT-004: esquema e evento inicial acordados. Não espera o formulário/envio completo de Paulo.

### Relação com cartões existentes

Complementa [S1-R01](https://trello.com/c/OaAB6z5B); Rebeca mantém consulta/autorização e a integração das telas de US-005/US-010/US-011. Cada frente aplica a base ao seu módulo; esta entrega não representa cobertura de todas as histórias futuras.

## BT-006 — Validar e promover migrations automaticamente ao cloud

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

Um PR recebe verificações automáticas e um push integrado na principal, aprovado pelo CI do mesmo commit, aplica migrations pendentes no Supabase cloud. Dados e contas reais de teste são preparados no cloud com rotina própria, sem reset do ambiente.

### Acceptance criteria

- [ ] CI em PR e push para a principal instala pelo lockfile e executa lint, tipos, build e integração com stack local completa desde banco vazio.
- [ ] Credenciais do CD configuradas em secrets do GitHub; confirmar que conexão pessoal do plugin não basta para o Actions.
- [ ] Deploy depende do CI do mesmo commit e serializa promoções para o mesmo projeto, sem interromper migration ativa por um novo push.
- [ ] Aplicar somente migrations pendentes após integração; não usar reset remoto, editar migrations integradas ou incluir publicação do Next.js.
- [ ] Verificar uma promoção real, histórico de migrations e reaplicação sem pendências, preservando dados existentes; CI falho impede o deploy.
- [ ] Rotina própria prepara quatro contas reais e dados fictícios no cloud, sem duplicar a carga nem apagar registros existentes. Verificar conexão, Auth e acesso com sessões reais.
- [ ] Documentar configuração inicial, secrets, promoção, migrations por frente, leitura dos logs e diagnóstico. Habilitar proteção/checks/revisão se as permissões permitirem, explicitando o que ficou ativo.
- [ ] A automação evolui para executar os testes acrescentados por BT-004/BT-005; não pode considerar somente testes antigos nem deixar testes falhos passarem.

### Blocked by

BT-002 e BT-003. O cloud precisa existir e a identidade local permite verificar a primeira migração útil e as contas no destino. Não depende de concluir criação ou consulta para iniciar o CD.

### Pré-requisito operacional

Conta GitHub com escrita e permissão para configurar secrets; na consulta do planejamento a conta só tinha leitura. Obter esse acesso antes de ativar/verificar CI/CD remoto. Código/configuração podem ser preparados localmente, mas esse cartão não é concluído apenas por escrever workflows.

## BT-007 — Comprovar que Rebeca e Paulo conseguem começar

### Parent

[SPEC-001](https://trello.com/c/vWo76DXs)

### What to build

Um ambiente limpo segue o guia e chega à aplicação local, sessões reais, dados de teste e verificações aprovadas, com instruções de skills/MCPs e divisão de frentes. Consolida a evidência de que a base entregue é utilizável sem explicações que só existem na conversa.

### Acceptance criteria

- [ ] Guia atualizado com origem/revisão e instalação das skills, versões reais das ferramentas e verificação do runtime de containers.
- [ ] Instruções de conexão e consultas de leitura para Trello, Drive, GitHub e Supabase; acessos pessoais e limitações de cada conexão explícitos.
- [ ] Comandos reais de dependências, ambiente local/cloud, migrations, contas/dados de teste, execução e verificações, sem publicar credenciais.
- [ ] Executar a sequência em ambiente limpo e registrar evidência de aplicação, sessões e isolamento entre Clientes; distinguir o que foi realmente verificado de ações que exigem autorização pessoal de Rebeca/Paulo.
- [ ] CI/CD demonstrados com todos os testes finais, migrations de identidade/solicitação/consulta presentes no cloud e dados existentes preservados.
- [ ] Guia explica contratos, cartões, bloqueadores, branch/PR, revisão e responsabilidade de cada frente, sem dizer que as histórias de produto estão prontas.
- [ ] Impedimentos de permissão ou configuração permanecem explícitos e impedem declarar prontidão completa quando afetam o aceite.

### Blocked by

BT-005 e BT-006. Reúne os contratos finais e a automação funcionando; atualizações parciais do guia acompanham cada entrega anterior.

## Publicação realizada

Os sete cartões foram publicados em Pronto para Implementação, cada um com Parent apontando à SPEC-001 e `Blocked by` com URLs dos cartões precedentes. A descrição e a lista de cada cartão foram relidas e verificadas após publicação. A SPEC-001 permaneceu intacta. Status `ready-for-agent` está em texto porque a etiqueta visual não existe e o conector não permite criá-la; etiquetas de produto foram preservadas. Os S1 existentes não foram modificados e suas relações constam dos cartões correspondentes.

Arestas publicadas: BT-001 → BT-002 e BT-003; BT-003 → BT-004; BT-004 → BT-005; BT-002 e BT-003 → BT-006; BT-005 e BT-006 → BT-007.
