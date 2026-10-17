# Evidência de execução — BT-001

Verificação em 2026-10-17, referente a [BT-001](https://trello.com/c/n4BRJlnF), na branch `main`. O cartão foi consultado ao vivo, com descrição, responsáveis, comentários e checklists: estava em Pronto para Implementação, sem membros, comentários ou checklists adicionais. Foi movido para Em Implementação.

## Resultado

**Implementação disponível, aceite de integração pendente.** Não declarar BT-001 concluído: o ambiente não tem Docker/Podman nem socket Docker, portanto a stack real não foi iniciada e o caminho positivo não foi comprovado.

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

## Retomar o aceite

1. Instalar/iniciar um runtime compatível com Docker e confirmar cliente **e servidor** com `docker version`. No WSL, habilitar a integração da distribuição.
2. Seguir o [guia local](desenvolvimento-local.md): `npm ci`, `npm run supabase:start`, `.env.local` com URL e chave Publishable/anon locais reais.
3. Executar `npm run check:connection` e `npm run test:integration`; ambos precisam passar com Auth/API/PostgreSQL reais.
4. Abrir a aplicação e confirmar o estado `connected`. Verificar também parada/início da stack com os comandos documentados. Registrar o resultado no cartão antes de concluir.

Os testes não substituem serviços por mocks e não pulam a integração quando faltam pré-requisitos. Contas/sessões reais e isolamento são entregas dos próximos cartões. Documentação escrita e build aprovado não equivalem ao aceite da stack.

## Fontes técnicas consultadas

- [Next.js: instalação e App Router](https://nextjs.org/docs/app/getting-started/installation).
- [Supabase: instalação e execução da CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e [changelog](https://supabase.com/changelog).
- [Auth: resposta do endpoint de saúde](https://github.com/supabase/auth/blob/master/internal/api/api.go).
- [PostgREST: documento OpenAPI na raiz](https://docs.postgrest.org/en/stable/references/api/openapi.html).

As dependências foram consultadas no registro npm e fixadas com lockfile. O changelog foi lido antes da configuração; não houve adoção de funcionalidades experimentais para substituir o runtime de containers exigido pelo cartão.
