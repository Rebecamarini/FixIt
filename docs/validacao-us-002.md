# Validação da US-002 — Entrar e sair

[Card e checklist](https://trello.com/c/BTDvLW6A) · [Spec aprovada](specs/us-002-entrar-sair.md).

## Base e responsabilidade

Retomada em **2026-10-24**: a tela real `/solicitacoes/nova` está no
[PR #8](https://github.com/Rebecamarini/FixIt/pull/8), head
`e9daa8455edb613cae4ddb98afe9e066cfa438d8`, junto com os commits da US-002
`78110f9` e `1bec0c0`. PR #8 e sua base, PR #5, continuam abertos, sem merge.
O bloqueio técnico do CA-03 foi resolvido e comprovado nessa composição local;
isso não afirma integração em `main` nem conclusão do fluxo de aceite humano.

A complementação está na worktree `FixIt-us002-final`, branch
`feat/us-002-validacao-final`, baseada nesse head. Reutiliza o script de navegador
da US-006 e acrescenta a prova de novo login com destino inicial após logout ou
sessão inválida/não renovável, sem alteração do código de produção.
As alterações do checkout original foram preservadas. A autorização de publicação
vigente está registrada na reconferência abaixo.

### Reconferência de 2026-10-25

O pedido atual autoriza terminar a parte técnica e deixar a revisão e o aceite
humanos para João. Foi reutilizada a worktree acima, preservando a branch da
US-003 e suas alterações locais. Os PRs #5 e #8 foram consultados ao vivo e
continuam abertos, nos mesmos SHAs registrados acima. O CI do PR #8 terminou
com sucesso na [execução 40121615769](https://github.com/Rebecamarini/FixIt/actions/runs/40121615769).
Esse resultado pertence ao head publicado `e9daa8455edb613cae4ddb98afe9e066cfa438d8`,
não ao novo head do complemento; seu CI deve ser conferido após a publicação.

`sg docker -c 'npm run verify'` foi executado novamente nesta worktree:
lint sem avisos, tipos, build, **7/7 unitários e 34/34 integrações reais**, sem
skips ou falhas. Não houve reset do banco nem alteração remota. Após a suíte,
o script de navegador foi executado contra esse build em `127.0.0.1:3102`:
seis combinações de papel/largura e os casos de sessão inválida e não renovável
passaram, incluindo novo login para `/`. As contagens permaneceram em
**42 solicitações e 42 eventos**, com zero erros JavaScript.

O roteiro de conta também foi repetido no mesmo build: os três papéis em
390 e 1440 px passaram credenciais inválidas, e-mail preservado, senha apagada,
nome na inicial, recarga, nova visita, redirecionamentos de login/cadastro e
saída local preservando uma sessão independente da mesma conta.

Revisão independente do complemento local contra `e9daa8455edb613cae4ddb98afe9e066cfa438d8`:
**Standards: 0 violações e 0 sugestões; Spec: 0 omissões corrigíveis, expansões
de escopo ou comportamentos incorretos.** A revisão usou o diff local dos três
arquivos, pois ainda não havia autorização para novo commit; ela não substitui
a revisão humana nem o CI de um novo head publicado.

O `AGENTS.md` local do checkout original exige autorização expressa para criar
commits, fazer push e abrir PRs. Após revisar o resultado concreto, João autorizou
expressamente essas três ações e a execução de no-mistakes/CI, **sem merge**.
O gate foi inicializado localmente; `no-mistakes doctor` confirmou a CLI, daemon
e agente Codex disponíveis. A versão instalada (1.46.0) cria PRs somente contra
a branch padrão. Para preservar a base empilhada aprovada, as etapas de PR e CI
do gate são substituídas pela abertura no conector GitHub sobre a branch da
US-006 e pela conferência do CI real desse PR. Revisão, teste, documentação,
lint e push continuam pelo gate; nenhum check remoto será considerado aprovado
por ter sido pulado na ferramenta.

Publicação preparada: branch `feat/us-002-validacao-final`, PR de complemento
com base em `feat/us-006-criar-solicitacao` (#8), para isolar o complemento
da entrega já publicada. Após publicar, conferir o CI do novo head e
registrar o link no card. Não incluir o trabalho independente da US-003 ou da
SPEC-002 e não fazer merge automático.

O card foi atualizado com os resultados locais, o CI já publicado da base e a
autorização de publicação do complemento; foi movido para
**Code Review**. O checklist de aceitação permanece desmarcado para o aceite
humano e o card continua aberto. Nenhum comentário ou mensagem foi enviado a
outros integrantes.

### Histórico da primeira validação

Consulta ao vivo em 2026-10-22: PR #5 aberto, sem merge, com head
`49d4719494bb6698d0dada0a49ac31c537eaec56`. A implementação reaproveita essa
base na branch atual `feat/us-001-autocadastro`, conforme a skill implement.
O diff desta entrega deve ser revisado contra esse commit; inclui a spec aprovada.
Não houve merge nem publicação desta entrega no GitHub.

João Ricardo confirmou ser responsável pela entrega. No Trello, US-002 está em
“Sprint 1 — João”, mas o membro vinculado ainda é Paulo. DEC-001 e DEC-002 foram
lidas ao vivo; prevalecem ADR 0001 e o escopo aprovado. O checklist consultado pela
ferramenta específica contém CA-01, CA-02 e CA-03, todos incompletos. A leitura
genérica do card retornou uma lista vazia de checklists; ela não foi usada para
concluir que o card não possuía critérios.

Naquela consulta, US-006 estava em “Sprint 1 — Paulo” e US-010 em
“Sprint 1 — Rebeca”; a base ainda não continha tela real de solicitações.
Na releitura de 2026-10-24, US-006 está em “Sprint 1 — João”, com João R;
US-002 continua em “Sprint 1 — João”, vinculada a Paulo, sem comentários e com
os três itens de aceite incompletos na leitura específica do checklist.

## Implementação

O login, formulário responsivo, limpeza da senha, inicial com nome,
redirecionamentos de autenticados e renovação SSR são reutilizados da US-001.
`sairDaConta(client)` consolida a saída local no módulo de conta; a Server Action
usa essa mesma fronteira verificada pelos testes e redireciona para o login
somente após sucesso. Falhas retornam mensagem sanitizada e permitem tentar de novo.
Sem alterações de esquema, migrations, dependências ou telas de solicitações.

## Evidências por critério

| Critério | Evidência local | Estado do aceite |
| --- | --- | --- |
| CA-01 | Auth e banco reais: login de Cliente, Manutentor e Gestor; identidade e papel protegidos; nome disponível; renovação e reconstrução por cookies. Navegador: os três papéis em 390 e 1440 px, nome na inicial, recarga, nova visita com cookies e redirecionamentos de login/cadastro. | Comprovado localmente; revisão humana e aceite no ambiente de testes pendentes. |
| CA-02 | Senha inválida recusada pelo Auth real, sem sessão. Navegador nos seis cenários: mensagem clara, e-mail preservado, senha apagada. Respostas 429/503 verificadas separadamente conforme descrição abaixo. | Comprovado localmente; revisão humana e aceite no ambiente de testes pendentes. |
| CA-03 — sessão | Saída pelo mesmo módulo usado na ação da interface; ausência de identidade e consulta de solicitações recusada na requisição seguinte; refresh revogado; sessão independente da mesma conta continua válida e renovável. Cookie antigo, após avanço controlado do relógio do cliente em duas horas, não se renova e tem consulta recusada. Navegador: retorno ao login, cookies removidos e contexto independente continua autenticado. | Comprovado localmente; revisão humana e aceite no ambiente de testes pendentes. |
| CA-03 — página protegida | `/solicitacoes/nova` acessível com sessão real dos três papéis, em 390 e 1440 px; após logout, histórico e URL direta exigem login. Sessões inválida e não renovável não apresentam a página protegida. Novo login retorna a `/`, inclusive após perda da sessão. | Comprovado localmente sobre o PR #8; revisão humana e aceite no ambiente de testes pendentes. |

Login sem perfil protegido também foi recusado e a sessão automática do Auth
foi removida. As integrações existentes continuam verificando RLS e rejeição de
elevação de papel por metadados editáveis.

O avanço do relógio é restrito ao teste, com restauração em `finally`; Auth e
banco permanecem reais. A prova verifica o caminho de renovação recusada, sem
esperar duas horas e sem simular respostas do Auth nessa integração.

## Navegador e reprodução

Supabase local em `http://127.0.0.1:54321`, Node 24.18.0 e Next.js 16.4.2.
Contas preparadas pelo procedimento administrativo existente:
`sg docker -c 'npm run prepare:test-data'` nesta sessão Linux; o comando sem `sg`
falhou por acesso ao Docker. Credenciais fictícias estão em
[contratos de identidade](contratos-identidade.md#preparação-administrativa-de-dados-fictícios).
As contas temporárias das integrações são removidas ao final.

Foi usado Chromium via Playwright disponível fora do repositório, sem instalar
dependências ou adicionar suíte permanente ao CI. Para cada papel, em 390×900 e
1440×900, foram conferidos:

1. Inicial pública e acesso ao login com link para cadastro.
2. Senha incorreta: mensagem, e-mail preservado, senha vazia e ausência de cookie de sessão.
3. Login válido: destino `/`, nome e botão Sair.
4. Recarga e nova visita em contexto com cookies preservados: nome mantido.
5. Abrir `/conta/entrar` e `/conta/cadastrar` autenticado: destino `/`.
6. Contexto limpo: inicial pública; login independente com a mesma conta.
7. Sair no primeiro contexto: destino `/conta/entrar`, cookies apagados e inicial pública.
8. Recarregar o segundo contexto: permanece autenticado; sair também nesse contexto.
9. Formulário sem transbordamento horizontal e sem erros JavaScript.

O fluxo foi conferido em desenvolvimento e repetido com `next build`/`next start`.
Em desenvolvimento, Next devolve `Cache-Control: no-store`; em produção local,
a resposta autenticada foi verificada com `private, no-store`.

Mensagens 429 e 503 foram conferidas no navegador em ambas as larguras por
**injeção de falhas somente na fronteira HTTP do Auth**, em um processo local de
`next start` com preload temporário fora do repositório. Apenas a chamada de login
recebeu a falha; os demais acessos continuaram reais. A interface apresentou as
mensagens próprias, preservou e-mail, apagou senha, não criou sessão e não exibiu
o detalhe interno inserido na resposta. Isso comprova apresentação e tratamento
dessas falhas; não comprova o limite real configurado no Auth nem uma indisponibilidade
real do serviço. Nenhum preload, atalho ou endpoint foi incluído na aplicação.

Capturas com contas fictícias:

- [Credenciais inválidas em celular](evidencias/us-002/login-invalido-mobile.png).
- [Inicial do Gestor em desktop](evidencias/us-002/inicial-gestor-desktop.png).
- [Excesso de tentativas em celular](evidencias/us-002/limite-mobile.png).
- [Indisponibilidade em desktop](evidencias/us-002/indisponibilidade-desktop.png).

## Histórico das verificações automatizadas

Os resultados abaixo da primeira execução foram reconfirmados em 2026-10-24
para lint, tipos, build e 7 unitários. As 34 integrações reais constam da entrega
da US-006 e o [CI do head do PR #8](https://github.com/Rebecamarini/FixIt/actions/runs/40121615769)
foi consultado: job CI aprovado, incluindo a etapa de lint, tipos, build,
unitários e todas as integrações em stack descartável; promoção de migrations
ignorada no evento de PR. A suíte destrutiva não foi repetida na stack local
compartilhada em 2026-10-24. A execução posterior está registrada na
[reconferência de 2026-10-25](#reconferência-de-2026-10-25).

- `npm run lint`: aprovado, sem avisos.
- `npm run typecheck`: aprovado; também executado durante os ciclos de integração.
- `npm run build`: aprovado; navegador repetido no build de produção.
- `npm test`: 7 testes aprovados.
- `sg docker -c 'npm run test:integration'`: 34 verificações aprovadas, sem skips.
- `git diff --check`: aprovado.

`npm run verify` passou lint, tipos, build e unitários; na etapa de integração,
33 de 34 verificações passaram e a preparação repetida falhou porque o subprocesso
da CLI não tinha acesso ao Docker. A repetição da suíte de integração inteira
com o grupo Docker ativo passou 34/34. Não foi alterada a implementação para
contornar essa condição do ambiente.

## Revisão code-review da primeira entrega

Dois revisores automatizados independentes examinaram o commit `78110f9` contra
a base `49d4719494bb6698d0dada0a49ac31c537eaec56`.

### Standards

Nenhuma violação dos padrões documentados. Uma sugestão opcional de baixa
prioridade: possível duplicação da preparação administrativa de contas nos três
novos cenários de integração. Os arranjos foram mantidos locais aos testes;
extrair outro helper não é necessário para os comportamentos verificados.
As demais heurísticas não produziram achados relevantes.

### Spec

Nenhuma omissão corrigível, comportamento incorreto ou expansão de escopo.
Um bloqueio de aceite integrado conhecido: CA-03 exige a tela real de
solicitações, cujo desenvolvimento está fora desta tarefa. A revisão confirma
que a evidência de sessão permite avançar, sem concluir esse critério ou o card.

Resultado: Standards — 0 violações e 1 sugestão opcional; Spec — 0 achados
corrigíveis e 1 bloqueio de aceite integrado. A atualização posterior a essa
revisão registra somente os resultados das verificações e da própria revisão.

## Integração comprovada em 2026-10-24

A alternativa US-006 atende à dependência técnica: a página real está sob o
matcher `/solicitacoes/:path*` do proxy e exige identidade confirmada pelo
servidor. Não é necessário implementar US-010 para comprovar o CA-03.

O [script existente](../tests/browser/us006.mjs), com Auth e banco locais reais,
foi executado contra `next build`/`next start`. Cliente, Manutentor e Gestor em
390×900 e 1440×900 passaram acesso autenticado, recarga sem cache, cancelamento,
logout, histórico e URL direta protegidos, seguidos de novo login para `/`.
As tentativas sem sessão recebem HTTP 307 para `/conta/entrar`.

Também passaram os casos de tokens inválidos e refresh revogado com expiração
forçada somente no cookie de teste. Ambos exigem login sem apresentar o título
protegido; um login real subsequente retorna à inicial. Não houve simulação de
respostas do Auth nem alteração do relógio do servidor nessa prova.

Os resultados da execução mais recente estão na
[reconferência de 2026-10-25](#reconferência-de-2026-10-25).
Reprodução e capturas estão no
[relatório da US-006](validacao-us-006.md#reprodução). O script temporário da
primeira validação, `/tmp/fixit-us002-browser.mjs`, também foi repetido para os
três papéis nas duas larguras: credenciais inválidas, persistência de sessão,
redirecionamentos e saída local com sessão independente preservada.

O bloqueio apontado pela revisão histórica acima foi resolvido nessa base.
Permanecem a integração dos PRs, revisão por outro integrante e aceite pelo
PO/professor no ambiente de testes. Nenhum cartão ou checklist foi concluído
nesta retomada; a revisão automatizada não substitui essas etapas. S1-J02 e
S1-J01 permanecem cartões separados, sem encerramento automático.

## Referências técnicas consultadas

- [SSR e propagação dos cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
- [Saída local e duração dos access tokens](https://supabase.com/docs/guides/auth/signout):
  logout remove cookies e revoga renovação; tokens de acesso previamente copiados
  podem permanecer válidos até expirar. Não foi introduzida uma política nova de
  revogação imediata de JWT nesta história.
- Changelog do Supabase e guias instalados do Next para Server Actions e autenticação.
