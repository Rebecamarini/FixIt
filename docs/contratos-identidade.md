# Identidade e perfil — BT-003

[SPEC-001](https://trello.com/c/vWo76DXs) · [BT-003](https://trello.com/c/oRtndcsS).
Base para S1-J01. As telas de cadastro/login foram acrescentadas pela
[US-001 e avanço da US-002](specs/us-001-autocadastro.md).
Login/logout dos três papéis e as pendências de aceite da US-002 estão no
[registro de validação](validacao-us-002.md).

## Contratos

`createRequestClient(cookieAdapter)` cria um cliente SSR por requisição; nunca
armazenar uma instância global. `createSessionClient()` usa cookies do Next.js
em Server Actions, Route Handlers e Server Components. `obterIdentidade(client)`
consulta Auth com `getUser()` e o perfil protegido, retornando
`{ id: string UUID, papel: "Cliente" | "Manutentor" | "Gestor" }` ou `null`
sem sessão/perfil. Falhas na consulta do perfil lançam erro sanitizado.
Metadados editáveis nunca são fonte de autorização.

`entrarNaConta(client, form)` valida o login e exige perfil protegido.
`sairDaConta(client)` encerra somente a sessão atual com `scope: "local"` e
retorna sucesso ou mensagem sanitizada; a Server Action redireciona ao login
apenas no sucesso. Sessões independentes permanecem válidas.

`src/proxy.ts` renova cookies e aplica `private, no-store` nas rotas `/`, `/conta`,
`/solicitacoes` e `/usuarios`. Ao acrescentar rotas
com sessão, inclua-as no matcher; páginas autenticadas não devem usar ISR/cache
compartilhado. O adaptador SSR propaga também cabeçalhos de renovação.

Autocadastro usa `client.auth.signUp` com este payload; sempre cria Cliente:

```ts
{
  email: "novo@example.test", // obrigatório, único no Auth
  password: "senha-de-exemplo", // mínimo oito caracteres, somente Auth
  options: { data: { nome: "Pessoa fictícia" } }
}
```

Sem confirmação de e-mail no ambiente configurado; cadastro retorna sessão.
Isso não comprova posse do endereço. E-mail e senha não são copiados ao perfil.
Na interface, a Server Action de cadastro usa um cliente com cookies isolados
e encerra essa sessão automática antes de redirecionar ao login; o navegador
somente recebe cookies de autenticação após entrar com e-mail e senha.
Nome deve ser string JSON; números, booleanos, arrays e objetos são recusados,
sem coerção. O trim segue `String.prototype.trim()` do JavaScript, incluindo
NBSP (U+00A0) e BOM (U+FEFF); valores compostos só desses espaços são vazios e
recusados. Matrícula e setor pessoal não fazem parte do cadastro.

`perfis`: `id uuid PK`, `nome text`, `matricula text nullable legado`,
`setor_id uuid nullable legado FK setores`, `papel text`, `excluido_em timestamptz`
e `provisionamento_pendente boolean` interno.
Valores antigos de matrícula/setor são preservados; novos fluxos não os leem nem
escrevem. A ausência de FK para `auth.users` mantém o perfil histórico após a
remoção das credenciais.
`setores`: `id uuid PK`, `nome text` obrigatório/único. Setores fictícios iniciais:
Ensino (`10000000-0000-4000-8000-000000000001`) e Administração
(`10000000-0000-4000-8000-000000000002`). Anon e autenticado podem consultá-los;
nenhum pode modificá-los. Perfil é visível somente ao próprio usuário.

O trigger transacional privado cria o perfil com o mesmo UUID do Auth e sempre
`Cliente`, inclusive quando o cadastro envia `papel: "Gestor"`. A criação
administrativa reserva previamente o perfil com UUID e papel definitivos. O
trigger reconhece essa reserva; o servidor cria a identidade Auth com o mesmo
UUID e só libera o perfil após revalidar o Gestor. Reservas incompletas não
conseguem usar a aplicação nem aparecem na gestão. O papel não pode mudar após
o INSERT, inclusive por SQL privilegiado. Clientes não têm grants para alterar
papel ou excluir perfis.

A migration `20261020231724_identity_explicit_client_grants` revoga os grants
de `anon`/`authenticated` nas duas tabelas e concede somente as leituras acima.
Isso torna o contrato independente dos grants automáticos de novas tabelas em
`public`, que variam entre projetos Supabase. RLS continua limitando as linhas
visíveis; `anon` recebe erro de permissão ao consultar `perfis`.

Erros observáveis do SDK: `AuthApiError` (credenciais inválidas, senha curta,
e-mail inválido/duplicado); regras do trigger podem aparecer como erro genérico
`Database error saving new user` sem revelar duplicidade ou detalhes internos.
Consumidores verificam `error`, sem depender da mensagem interna do PostgreSQL.
Ausência de perfil alheio retorna `data: null`/lista vazia pela RLS; escrita sem
grants retorna erro de permissão. Não apresentar tokens/erros administrativos.

Exemplo de uso em Server Action (a UI fica nas histórias):

```ts
const client = await createSessionClient();
const { error } = await client.auth.signInWithPassword({ email, password });
if (error) return { erro: "Credenciais inválidas." };
const identidade = await obterIdentidade(client);
```

## Preparação administrativa de dados fictícios

Após `npm run supabase:start` e `npx supabase db reset --local`, configure
`.env.local` conforme o guia e execute `npm run prepare:test-data`.
Se sua sessão Linux ainda não tiver o grupo Docker ativo, use
`sg docker -c 'npm run prepare:test-data'`. O reset é somente local e destrutivo.

A rotina cria/verifica contas reais, confirmadas no Auth:

| E-mail fictício | Papel |
| --- | --- |
| cliente1@fixit.example | Cliente |
| cliente2@fixit.example | Cliente |
| manutentor@fixit.example | Manutentor |
| gestor@fixit.example | Gestor |

Senha local fictícia padrão: `Fixit-ficticio-123!`; pode ser substituída por
`FIXIT_TEST_PASSWORD`. A mesma senha deve ser fornecida no rerun para verificar
as sessões, sem redefinir senhas. A rotina detecta colisões por e-mail ou
marcador administrativo `app_metadata.fixit_fixture`; não promove nem
sobrescreve contas existentes sem o marcador e perfil esperado. Se houver falha,
corrija explicitamente a colisão antes de repetir. Nunca execute testes
destrutivos de integração contra cloud.

No cloud, somente **depois da integração e aplicação das migrations**, configure
`SUPABASE_TARGET=cloud`, URL/chave pública do projeto, `SUPABASE_SECRET_KEY`
administrativa, `FIXIT_TEST_PASSWORD` sem padrão, e
`FIXIT_PREPARE_CLOUD=confirmar-dados-ficticios`. Execute a mesma rotina de forma
separada do deploy. Não exponha a chave administrativa no navegador ou Git.
O script não lê credenciais pessoais da CLI no cloud.

O primeiro Gestor é provisionado pela rotina administrativa existente
`prepare-test-data`, fora do autocadastro e somente no ambiente de demonstração
explicitamente selecionado. A rotina reserva cada UUID com seu papel definitivo,
cria a identidade Auth com o mesmo UUID e libera o perfil para uso; nunca promove
uma conta existente. Isso prepara `gestor@fixit.example` para o primeiro acesso.
Depois disso, a gestão do FixIt cria Manutentores/Gestores. Não há assistente de
provisionamento nem alteração posterior de papel.

A rotina também prepara 21 solicitações próprias por Cliente e verifica os eventos
iniciais com sessões reais; veja o [contrato de consulta](contratos-solicitacoes.md#consulta-própria--bt-005).

## Verificação

`npm run test:integration` usa Auth/API/PostgreSQL reais e cookie jar SSR:
cadastro sem os campos pessoais removidos, duplicatas de e-mail, papéis fixos,
validações,
sessão reconstruída, isolamento,
logout, senha inválida e ataques de papel. A preparação é repetível e autentica
as quatro contas sem alterar senhas no rerun. As integrações exigem alvo
explicitamente local e acessam a chave administrativa local somente no helper
de testes para limpar suas próprias identidades temporárias.

As migrations de revisão `20261018152845_identity_javascript_trim` e
`20261018152923_identity_metadata_text` corrigem a fronteira de cadastro sem
reescrever identidades existentes. A primeira valida constraints sobre os perfis
atuais: se houver nome/matrícula não normalizados, a promoção falha e exige
reconciliação administrativa explícita antes de repetir, evitando colisões ou
mudança silenciosa de matrícula. As duas migrations originais ficam preservadas.

## Gerenciar contas — US-004

[US-004](https://trello.com/c/waxQ1rjj) · migration `20261025175916_us004_account_management`.

Gestor ativo consulta contas ativas por nome/e-mail, papel, ordem alfabética e
páginas de 20. O servidor une perfis ativos aos e-mails de Auth; a chave
administrativa não chega ao navegador. Gestor cria somente Manutentor/Gestor,
com senha inicial entregue fora do FixIt, sem substituir a própria sessão.
Autocadastro continua criando Cliente. Senhas não são retornadas em consultas.

Se a resposta da criação ou de sua finalização não chegar, o formulário preserva
somente dados não secretos e permite “Conferir criação”. A finalização é
idempotente, confere o Gestor atual e não recebe senha. Reservas ainda sem
identidade Auth continuam sem acesso e orientam aguardar ou procurar o
responsável em caso de indisponibilidade persistente.

Exclusão é terminal: a função `us004_excluir_conta` serializa operações,
revalida Gestor ativo, impede autoexclusão e preserva ao menos um Gestor. Marca
o perfil e grava auditoria imutável com alvo, autor e data/hora. Em seguida o
Auth remove credenciais e e-mail; perfil, solicitações e eventos preservam os
UUIDs históricos. RLS recusa o próximo acesso feito com JWT antigo. Recadastrar
o endereço cria outro UUID Cliente sem vínculos anteriores. Consulta de contas
excluídas continua fora desta entrega ([futura](https://trello.com/c/KHRLMHXm)).

`SUPABASE_SECRET_KEY` permite criar e remover contas somente no servidor, depois
da checagem de Gestor ativo. A listagem administrativa de e-mails não usa RLS e
nunca é disponibilizada a papéis não autorizados.

## Perfil e credenciais — US-003

[Spec](https://trello.com/c/dnMogmjC) · [T01](https://trello.com/c/QwPZeKPc) ·
[T02](https://trello.com/c/BAQgjkFB) · [T03](https://trello.com/c/sLaHxNCC).

A US-004 restringe os grants da migration `20261024194318_profile_self_update`
somente ao UPDATE do `nome` da linha própria. ID, papel, exclusão lógica,
matrícula, setor, INSERT e DELETE continuam protegidos. Não altera históricos
nem vínculos.

`consultarPerfil(client)` retorna o perfil próprio com e-mail obtido no Auth;
`salvarPerfil(client, form)` aceita somente nome.
`alterarEmail(client, form)` aceita `email` e `senha_atual`;
`alterarSenha(client, form)` aceita `senha_atual`, `nova_senha`, `confirmar_senha`.
Todos conferem a identidade no servidor e recusam campos extras de alvo/papel.
Retornam `ProfileState` com confirmação, erros por campo, aviso sanitizado,
perda de sessão ou resultado parcial, sem devolver senhas.

A senha atual é verificada em cliente temporário com cookies isolados e logout
local. A sessão do navegador permanece intacta. A troca de senha usa a identidade
do usuário, seguida de `signOut({ scope: "others" })`. Tokens já emitidos podem
continuar válidos até expirar; a sessão atual permanece renovável.
`encerrarOutrasSessoes(client)` permite repetir somente a revogação após sucesso
parcial, sem nova troca ou senha atual. Requer sessão e perfil próprios.

Exceção autorizada pelo usuário no [ADR 0004](adr/0004-troca-email-auth-administrativa.md):
a troca imediata de e-mail usa a capacidade administrativa do Auth, somente após
validar sessão/perfil/senha atual, com ID derivado da sessão e `email_confirm: true`.
Exige `SUPABASE_SECRET_KEY` somente no servidor, separada da chave pública;
consultas e gravações do próprio perfil continuam com identidade do usuário. O Auth local encapsula
algumas duplicatas de e-mail em HTTP 500 sem código identificável: nesses casos
informa resultado não confirmado e possível endereço ocupado, sem afirmar a
causa ou expor detalhes. O banco continua garantindo unicidade concorrente.

`/conta/perfil` está coberta pelo proxy de `/conta/:path*` e usa renderização dinâmica.
Os modais mantêm a edição pessoal em estado separado, limpam senhas a cada envio
e ao fechar, contêm foco e restauram o acionador. Voltar e fechar modal preenchido
pedem confirmação. Perda de sessão leva ao login com aviso de descarte; o login
continua destinando à inicial, sem rascunhos persistidos.
