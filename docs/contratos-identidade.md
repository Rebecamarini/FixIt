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

`src/proxy.ts` renova cookies e aplica `private, no-store` nas rotas `/`, `/conta` e
`/solicitacoes`. Ao acrescentar rotas
com sessão, inclua-as no matcher; páginas autenticadas não devem usar ISR/cache
compartilhado. O adaptador SSR propaga também cabeçalhos de renovação.

Cadastro usa `client.auth.signUp` com este payload:

```ts
{
  email: "novo@example.test", // obrigatório, único no Auth
  password: "senha-de-exemplo", // mínimo oito caracteres, somente Auth
  options: { data: {
    nome: "Pessoa fictícia", // texto obrigatório, espaços das pontas removidos
    matricula: "00Ab01", // texto obrigatório; trim; unicidade lower(matricula)
    setor_id: "10000000-0000-4000-8000-000000000001" // UUID existente
  } }
}
```

Sem confirmação de e-mail no ambiente configurado; cadastro retorna sessão.
Isso não comprova posse do endereço. E-mail e senha não são copiados ao perfil.
Na interface, a Server Action de cadastro usa um cliente com cookies isolados
e encerra essa sessão automática antes de redirecionar ao login; o navegador
somente recebe cookies de autenticação após entrar com e-mail e senha.
Nome e matrícula devem ser strings JSON; números, booleanos, arrays e objetos
são recusados, sem coerção. O trim segue `String.prototype.trim()` do JavaScript,
incluindo NBSP (U+00A0) e BOM (U+FEFF); valores compostos só desses espaços
são vazios e recusados. Campos nulos, ausentes e setor inexistente são recusados.
Não há formato institucional imposto à matrícula; zeros iniciais são preservados.

`perfis`: `id uuid PK/FK auth.users`, `nome text`, `matricula text`,
`setor_id uuid FK setores`, `papel text`; todos não nulos.
`setores`: `id uuid PK`, `nome text` obrigatório/único. Setores fictícios iniciais:
Ensino (`10000000-0000-4000-8000-000000000001`) e Administração
(`10000000-0000-4000-8000-000000000002`). Anon e autenticado podem consultá-los;
nenhum pode modificá-los. Perfil é visível somente ao próprio usuário.

O trigger transacional privado cria o perfil com o mesmo UUID do Auth e sempre
`Cliente`, inclusive quando o cadastro envia `papel: "Gestor"`. Uma falha de
constraint impede ambos os registros. Clientes não têm grants de INSERT,
UPDATE ou DELETE em perfis, inclusive para alterar o papel. Papéis privilegiados
não recebem acesso antecipado a perfis alheios nesta preparação.

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

| E-mail fictício | Matrícula | Papel |
| --- | --- | --- |
| cliente1@fixit.example | 0001 | Cliente |
| cliente2@fixit.example | 0002 | Cliente |
| manutentor@fixit.example | 0003 | Manutentor |
| gestor@fixit.example | 0004 | Gestor |

Senha local fictícia padrão: `Fixit-ficticio-123!`; pode ser substituída por
`FIXIT_TEST_PASSWORD`. A mesma senha deve ser fornecida no rerun para verificar
as sessões, sem redefinir senhas. A rotina detecta colisões por e-mail, matrícula
ou marcador administrativo `app_metadata.fixit_fixture`; não promove nem
sobrescreve contas existentes sem o marcador e perfil esperado. Se houver falha,
corrija explicitamente a colisão antes de repetir. Nunca execute testes
destrutivos de integração contra cloud.

No cloud, somente **depois da integração e aplicação das migrations**, configure
`SUPABASE_TARGET=cloud`, URL/chave pública do projeto, `SUPABASE_SECRET_KEY`
administrativa, `FIXIT_TEST_PASSWORD` sem padrão, e
`FIXIT_PREPARE_CLOUD=confirmar-dados-ficticios`. Execute a mesma rotina de forma
separada do deploy. Não exponha a chave administrativa no navegador ou Git.
O script não lê credenciais pessoais da CLI no cloud.

A atribuição inicial de Manutentor/Gestor ocorre exclusivamente nessa rotina
administrativa com chave privilegiada; futuras alterações de papéis exigem
procedimento administrativo revisado, nunca `user_metadata` nem cliente público.
Não há tela de gestão entregue aqui.

A rotina também prepara 21 solicitações próprias por Cliente e verifica os eventos
iniciais com sessões reais; veja o [contrato de consulta](contratos-solicitacoes.md#consulta-própria--bt-005).

## Verificação

`npm run test:integration` usa Auth/API/PostgreSQL reais e cookie jar SSR:
cadastro, normalização/duplicatas (incluindo os 25 caracteres do trim JavaScript),
BOM isolado, os quatro tipos JSON não textuais nos dois campos, validações,
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

## Perfil e credenciais — US-003

[Spec](https://trello.com/c/dnMogmjC) · [T01](https://trello.com/c/QwPZeKPc) ·
[T02](https://trello.com/c/BAQgjkFB) · [T03](https://trello.com/c/sLaHxNCC).

A migration `20261024194318_profile_self_update` amplia a permissão anterior
somente para UPDATE de `nome`, `matricula` e `setor_id` da linha própria. ID,
papel, INSERT e DELETE continuam protegidos. Constraints existentes preservam
normalização, unicidade e setor cadastrado; a atualização dos três campos usa
uma única instrução SQL. Não altera históricos nem vínculos.

`consultarPerfil(client)` retorna o perfil próprio com e-mail obtido no Auth;
`salvarPerfil(client, form)` aceita somente os três campos pessoais.
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
nenhuma consulta ou gravação de perfil usa essa chave. O Auth local encapsula
algumas duplicatas de e-mail em HTTP 500 sem código identificável: nesses casos
informa resultado não confirmado e possível endereço ocupado, sem afirmar a
causa ou expor detalhes. O banco continua garantindo unicidade concorrente.

`/conta/perfil` está coberta pelo proxy de `/conta/:path*` e usa renderização dinâmica.
Os modais mantêm a edição pessoal em estado separado, limpam senhas a cada envio
e ao fechar, contêm foco e restauram o acionador. Voltar e fechar modal preenchido
pedem confirmação. Perda de sessão leva ao login com aviso de descarte; o login
continua destinando à inicial, sem rascunhos persistidos.
