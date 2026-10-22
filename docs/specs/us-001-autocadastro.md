# US-001 — Autocadastrar Cliente

Fonte: [card US-001](https://trello.com/c/nxKsfzLE), consultado em 2026-10-21.
Entrevista encerrada em 2026-10-22: a Q5 confirmou o fluxo da spec, sem autorizar implementação. Após a execução antecipada, o usuário aceitou manter o trabalho e seguir com a revisão; posteriormente, solicitou explicitamente corrigir os achados, revisar novamente e fazer o commit conforme a skill `implement`.

## Decisões confirmadas

- Após cadastro válido, redirecionar diretamente para a tela de login, sem página intermediária de boas-vindas. Encerrar a sessão automática retornada pelo Auth para que o acesso ocorra pelo login.
- Criar página “Criar conta”, acessível pela página inicial, responsiva e seguindo as cores atuais do FixIt. Exibir os cinco campos previstos, setores consultados do banco, opção de mostrar senha e erros próximos dos campos.
- Para falhas de cadastro por duplicidade sem identificação do campo, informar: “Não foi possível cadastrar. Verifique os dados; e-mail e matrícula devem ser únicos”. Preservar os dados preenchidos, exceto a senha, para correção.
- Incluir nesta entrega a tela funcional de login com e-mail e senha, registrando essa parte como avanço da US-002. Decisão confirmada na Q4.
- Login válido redireciona à página inicial autenticada, exibindo nome e opção “Sair”. Credenciais inválidas mantêm o usuário no login com mensagem clara. Sair encerra a sessão atual e retorna ao login. Fluxo aprovado na Q5: criar conta → login → página inicial autenticada → sair.

## Regras existentes

Nome, e-mail, senha, matrícula e setor são obrigatórios. E-mail e matrícula são únicos; senha tem pelo menos oito caracteres. Matrícula é textual, preserva zeros iniciais, remove espaços nas pontas e não distingue maiúsculas de minúsculas para unicidade. Setor pertence à lista cadastrada. Autocadastro sempre cria Cliente, sem confirmação por e-mail nem consulta institucional. Ver [contrato de identidade](../contratos-identidade.md).

## Entrega

Rotas `/conta/cadastrar`, `/conta/entrar` e `/` com operações por Server Actions e Supabase sob a identidade do usuário. Cadastro usa cookies isolados e revoga a sessão automática, sem autenticar o navegador. Nenhuma migration nova é necessária. As telas de solicitações permanecem nas histórias correspondentes.

As ações não expõem mensagens internas do banco nem devolvem senha no estado do formulário. Setor deve existir, inclusive quando a ação é chamada sem passar pela validação HTML. Regras transacionais existentes impedem perfis incompletos, duplicidade e escolha de papel pelo visitante. Falhas de rede e excesso de tentativas recebem mensagens próprias; falhas de perfil encapsuladas pelo Auth podem exigir a mensagem genérica aprovada, sem identificar o campo duplicado.

## Roteiro de aceite

1. Pela página inicial, abrir “Criar conta” e preencher nome, e-mail, senha, matrícula e setor. Verificar obrigatoriedade, senha mínima, opção de mostrar senha e layout em celular.
2. Cadastrar dados válidos. Conferir mensagem de sucesso na tela de login, ausência de sessão no navegador e perfil persistido como Cliente, com matrícula normalizada e zeros preservados.
3. Tentar cadastrar e-mail já utilizado e, separadamente, matrícula equivalente sem distinguir maiúsculas/minúsculas. Conferir recusa, mensagem e preservação dos campos, exceto senha.
4. Enviar nome composto somente por espaços e setor inexistente. Conferir recusa também na validação do servidor, sem criar conta.
5. Entrar com senha incorreta: permanecer no login, com aviso, e-mail preservado e senha apagada. Entrar com credenciais válidas: página inicial mostra o nome; recarregar mantém a sessão.
6. Abrir outra sessão de navegador: não deve mostrar o nome ou a opção de sair da primeira. Usuário autenticado que acessa cadastro/login retorna à página inicial.
7. Sair e voltar à página inicial: nome e opção de sair desaparecem, voltando os links de acesso. Cadastro, login e página inicial usam `private, no-store`.

`tests/account.integration.ts` integra as validações da aplicação ao Auth/banco reais e acompanha a suíte existente em `npm run test:integration`. Execute também `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. No ambiente WSL desta entrega, as integrações exigem `sg docker -c 'npm run test:integration'` para que a preparação existente tenha acesso ao Docker. As integrações destrutivas continuam restritas ao Supabase local; não executá-las contra cloud.

## Validação local — 2026-10-22

- Validação inicial: lint sem warnings, tipos e build de produção aprovados; cinco testes unitários e 28 verificações de integração aprovados, sem falhas ou skips.
- Chromium contra o build de produção e Supabase local: cadastro real, perfil Cliente, ausência de cookies de sessão após cadastrar, e-mail/matrícula duplicados, nome vazio após trim, preservação de todos os campos exceto senha, login incorreto/correto, recarga autenticada, isolamento em outro contexto, redirecionamento de usuário autenticado e logout aprovados. Sem erros JavaScript. Conta temporária do navegador removida ao final.
- Layout inspecionado em 390 × 844 e 1440 × 1000, sem transbordamento horizontal no cadastro mobile. Capturas locais: `/tmp/fixit-cadastro-mobile.png` e `/tmp/fixit-inicio-autenticado.png`.
- O teste de navegador usou a instalação de Playwright já disponível no ambiente, sem acrescentar dependências ao projeto. Seu roteiro reproduzível está acima; não integra o CI. Os testes novos de integração entram no CI pelo comando existente.
- Revisão local e `git diff --check` sem problemas remanescentes. Nenhuma migration ou escrita no cloud; publicação, revisão humana e aceite do card permanecem etapas posteriores.

## Correções da revisão

Os dois achados P2 da revisão foram corrigidos: o registro acima distingue aprovação da spec de autorização para implementar; HTTP 429 no login agora orienta aguardar antes de tentar novamente, assim como no cadastro. O teste `tests/account.test.ts` exercita `entrarNaConta` com o SDK real e uma resposta HTTP 429 simulada na fronteira externa. Falhou antes da correção e passou depois, verificando também e-mail preservado e ausência da senha no resultado.

Após as correções, `sg docker -c 'npm run verify'` passou integralmente: lint, tipos, build, seis testes unitários e 28 verificações de integração, sem falhas ou skips. Nova revisão independente de toda a entrega contra a base `795ae887283ac2f96cda0d26d9acdb08f33b4e5d`: Standards com zero achados e Spec com zero achados pendentes. A alteração preexistente em `.gitignore` está fora da revisão e do commit desta entrega.
