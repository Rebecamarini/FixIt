# Validação parcial da US-002 — Entrar e sair

[Card e checklist](https://trello.com/c/BTDvLW6A) · [Spec aprovada](specs/us-002-entrar-sair.md).

## Base e responsabilidade

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

US-006 continua em “Sprint 1 — Paulo” e US-010 em “Sprint 1 — Rebeca”. Nenhuma
tela real de solicitações está integrada nesta base.

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
| CA-03 — sessão | Saída pelo mesmo módulo usado na ação da interface; ausência de identidade e consulta de solicitações recusada na requisição seguinte; refresh revogado; sessão independente da mesma conta continua válida e renovável. Cookie antigo, após avanço controlado do relógio do cliente em duas horas, não se renova e tem consulta recusada. Navegador: retorno ao login, cookies removidos e contexto independente continua autenticado. | Parcial: a fronteira de sessão/dados foi verificada. |
| CA-03 — página protegida | Ausente uma tela real de solicitações nesta base. A inicial pública após logout não comprova esse critério. | **Pendente; impede concluir o card.** |

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

## Pendência obrigatória de integração

- Blocked by: https://trello.com/c/3ouBfqLb (US-006, alternativa).
- Blocked by: https://trello.com/c/Qq6TOsG4 (US-010, alternativa).

Após integrar ao menos uma dessas telas reais, testar acesso autenticado, sair e
tentar acesso direto e pelo histórico. Repetir com sessão inválida/não renovável,
verificando ausência de dados protegidos e exigência de login. Após novo login,
o destino deve ser `/`. Incluir a rota no mecanismo de renovação existente se
ela estiver fora de `/solicitacoes`.

O card permanece sem conclusão. Também faltam revisão por outro integrante e
aceite pelo PO/professor no ambiente de testes. A revisão automatizada não
substitui essas etapas.

## Referências técnicas consultadas

- [SSR e propagação dos cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
- [Saída local e duração dos access tokens](https://supabase.com/docs/guides/auth/signout):
  logout remove cookies e revoga renovação; tokens de acesso previamente copiados
  podem permanecer válidos até expirar. Não foi introduzida uma política nova de
  revogação imediata de JWT nesta história.
- Changelog do Supabase e guias instalados do Next para Server Actions e autenticação.
