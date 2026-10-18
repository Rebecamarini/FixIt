# Identidade e perfil — BT-003

[SPEC-001](https://trello.com/c/vWo76DXs) · [BT-003](https://trello.com/c/oRtndcsS).
Base para S1-J01; não entrega suas telas de cadastro/login.

## Contratos

`createRequestClient(cookieAdapter)` cria um cliente SSR por requisição; nunca
armazenar uma instância global. `createSessionClient()` usa cookies do Next.js
em Server Actions, Route Handlers e Server Components. `obterIdentidade(client)`
consulta Auth com `getUser()` e o perfil protegido, retornando
`{ id: string UUID, papel: "Cliente" | "Manutentor" | "Gestor" }` ou `null`
sem sessão/perfil. Falhas na consulta do perfil lançam erro sanitizado.
Metadados editáveis nunca são fonte de autorização.

`src/proxy.ts` renova cookies e aplica `private, no-store` nas rotas `/conta` e
`/solicitacoes`, reservadas para as histórias de produto. Ao acrescentar rotas
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
Campos nulos, ausentes, nome/matrícula vazios e setor inexistente são recusados.
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
cadastro, normalização/duplicatas, validações, sessão reconstruída, isolamento,
logout, senha inválida e ataques de papel. A preparação é repetível e autentica
as quatro contas sem alterar senhas no rerun. As integrações exigem alvo
explicitamente local e acessam a chave administrativa local somente no helper
de testes para limpar suas próprias identidades temporárias.
