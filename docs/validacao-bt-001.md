# Evidência de execução — BT-001

Verificação em 2026-10-17, referente a [BT-001](https://trello.com/c/n4BRJlnF), na branch `main`. O cartão foi consultado ao vivo, com descrição, responsáveis, comentários e checklists: estava em Pronto para Implementação, sem membros, comentários ou checklists adicionais. Foi movido para Em Implementação.

## Atualização — integração local aprovada

Continuação em 2026-10-17 na branch `ticket/bt-001-runtime`, baseada na integração da SPEC-001. O impedimento abaixo foi resolvido: Docker Engine 29.1.3 foi instalado pelo pacote Ubuntu `docker.io` no WSL 2 com systemd, com daemon iniciado e usuário no grupo Docker. A sessão existente usa `sg docker -c 'comando'`; uma nova sessão recebe o grupo normalmente. O [guia local](desenvolvimento-local.md) e o [guia da equipe](inicio-equipe.md) registram a alternativa.

| Verificação real | Resultado |
| --- | --- |
| Instalação limpa | `npm ci` reinstalou as dependências fixadas com sucesso. |
| Stack completa | `npm run supabase:start` terminou com código 0, sem excluir serviços nem ignorar saúde. PostgreSQL 17.11.0.004, GoTrue 2.197.0, PostgREST 16.4 e Storage 1.82.1 em execução; os 12 containers iniciaram, todos os que possuem healthcheck ficaram saudáveis. |
| Ambiente | URL e chave Publishable reais obtidas da CLI, gravadas em `.env.local` ignorado e sem exibir credenciais. Nenhuma chave administrativa usada pela aplicação. |
| Diagnóstico e integração | `check:connection` e o teste de integração passaram com Auth/API reais, antes e após reiniciar a stack; zero mocks e zero skips. O teste de chave inválida revelou que health/OpenAPI locais aceitam qualquer chave; o diagnóstico passou a consultar também a listagem autorizada de buckets em Storage, que rejeita a chave falsa. Nenhum conteúdo retornado é exibido pela aplicação. O teste de integração havia falhado antes da configuração real. |
| PostgreSQL/Storage | Consulta SQL real aprovada e `/storage/v1/status` respondeu HTTP 200. |
| Aplicação | Build de produção aprovado; `npm start` e requisição real a `/` retornaram HTTP 200 e mensagem de conexão local verificada. |
| Persistência | `supabase:stop` normal e `supabase:start` restauraram o backup. Um registro descartável em esquema privado manteve o valor `preservado` após o ciclo. O esquema foi removido após a consulta, sem deixar fixtures fora de migrations. |
| Checks | Lint, TypeScript, quatro testes de diagnóstico, teste de integração real e build aprovados. |
| Recursos | WSL com 7,6 GiB de RAM e 2 GiB de swap suportou a stack completa. O primeiro download/extração consumiu aproximadamente 7,6 GiB de cache; os reinícios reutilizaram imagens. |

BT-001 tem o caminho positivo local comprovado. Sessões, perfis, isolamento e contratos de negócio continuam nos cartões dependentes. O acesso anônimo ao OpenAPI funciona nesta stack local; o [changelog de fevereiro](https://supabase.com/changelog/42949-breaking-change-removing-access-to-openapi-spec-via-the-anon-key) restringe essa consulta no cloud, cuja adaptação pertence a BT-002.

## Registro anterior — impedimento superado

Na primeira execução, a implementação estava disponível e o aceite de integração permanecia pendente: o ambiente ainda não tinha Docker/Podman nem socket Docker. A tabela abaixo preserva o resultado histórico anterior à atualização acima.

| Verificação | Resultado observado |
| --- | --- |
| Runtime | Node 24.18.0 e npm 11.16.0. |
| Instalação inicial e limpa | `npm install` gerou o lockfile; `npm ci` reinstalou 354 pacotes com sucesso. |
| CLI | `npx --no-install supabase --version`: 2.121.0. Comandos conferidos no `--help`. |
| Configuração | `supabase init` gerou a configuração versionada. Mantidos Auth, API, PostgreSQL e Storage; sem migrations/seeds de negócio nesta tarefa. |
| Início da stack | `supabase start` falhou com `DockerLifecycleInspectError`: `docker: command not found (podman also not found)`. |
| Tipos e lint | `npm run typecheck` e `npm run lint` aprovados. |
| Testes de diagnóstico | `npm test`: 4 testes aprovados; configuração ausente, inválida, chaves administrativas e conexão/chave recusada. |
| Build | `npm run build` aprovado após instalação limpa; rota `/` dinâmica. |
| Aplicação | `npm start` disponível em 127.0.0.1:3000; HTTP 200 confirmado por requisição real, com idioma pt-BR, diagnóstico de configuração ausente e botão para refazer a verificação. |
| Comando de conexão | Sem ambiente, retornou diagnóstico de configuração ausente e código 1, conforme esperado. |
| Integração real | `npm run test:integration` falhou sem ambiente. Com URL local e chave explicitamente fictícia para exercitar indisponibilidade, falhou com `unavailable`, inclusive fora do sandbox. **Nenhuma chave local válida foi obtida; conexão bem-sucedida não foi testada.** |
| Auditoria npm | Produção: zero vulnerabilidades. Desenvolvimento: cinco alertas altos transitivos via `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces` (GHSA-vfj7-8cjw-p6xm). O npm não indica correção compatível; não foi aplicado downgrade forçado para Next 14. |

O sandbox precisou de autorização para acesso npm, pasta de configuração `~/.supabase`, subprocessos do build e escuta HTTP. A falha do runtime foi confirmada fora do sandbox; não é apenas uma limitação de rede do agente.

## Sequência usada para retomar o aceite

1. Instalar/iniciar um runtime compatível com Docker e confirmar cliente **e servidor** com `docker version`. No WSL, habilitar a integração da distribuição.
2. Seguir o [guia local](desenvolvimento-local.md): `npm ci`, `npm run supabase:start`, `.env.local` com URL e chave Publishable/anon locais reais.
3. Executar `npm run check:connection` e `npm run test:integration`; ambos precisam passar com Auth/API/PostgreSQL reais.
4. Abrir a aplicação e confirmar o estado `connected`. Verificar também parada/início da stack com os comandos documentados. Registrar o resultado no cartão antes de concluir.

Os testes não substituem serviços por mocks e não pulam a integração quando faltam pré-requisitos. Contas/sessões reais e isolamento são entregas dos próximos cartões. Documentação escrita e build aprovado não equivalem ao aceite da stack.

## Revisão

Aplicada a skill `code-review` com dois agentes independentes, comparando `58bdbc260ec05171dc0dbf7975fc262363006df5...2c5e5f2`:

- **Padrões:** zero achados; arquitetura, versões fixadas, ambiente e diagnóstico seguros seguem as instruções do repositório.
- **Especificação:** zero defeitos de código ou aumento de escopo; um bloqueio operacional de aceite, a conexão bem-sucedida com a stack real ainda não verificada.

As alterações de documentação que já existiam no workspace foram preservadas fora do commit. O guia local entregue neste cartão está versionado; o link acrescentado ao guia da equipe existente permanece junto das alterações anteriores desse arquivo.

## Fontes técnicas consultadas

- [Next.js: instalação e App Router](https://nextjs.org/docs/app/getting-started/installation).
- [Supabase: instalação e execução da CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e [changelog](https://supabase.com/changelog).
- [Auth: resposta do endpoint de saúde](https://github.com/supabase/auth/blob/master/internal/api/api.go).
- [PostgREST: documento OpenAPI na raiz](https://docs.postgrest.org/en/stable/references/api/openapi.html).

As dependências foram consultadas no registro npm e fixadas com lockfile. O changelog foi lido antes da configuração; não houve adoção de funcionalidades experimentais para substituir o runtime de containers exigido pelo cartão.
