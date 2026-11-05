# Validação da US-025

Cartão: https://trello.com/c/4lXN4cDB.
Branch local: `feat/us-025-cadastrar-bem-patrimonial`, base `aebcf2c`.
Implementação autorizada pelo usuário após confirmação da spec. A validação inicial abaixo foi executada antes de commit, push, PR ou alteração cloud. Em pedido separado de 2026-11-05, o usuário autorizou publicar o PR e fazer merge se os checks passarem; links, SHAs e resultado da publicação serão mantidos no cartão.

## Ambiente e escopo

Validação em 2026-11-05 com Node 24.18.0, npm 11.16.0, Next.js 16.4.2 e Supabase local na VM Colima `fixit-validation`. A aplicação usa o destino local explícito. Dados de teste fictícios, sem credenciais neste documento.

## Evidências de desenvolvimento

- TDD da persistência: teste inicial falhou pela ausência do módulo; cadastro mínimo passou depois da implementação. Expansão para concorrência/reenvio, validações e autorização: quatro testes de integração reais aprovados.
- TDD de navegador: visitante inicialmente recebia 404; após página protegida, redirecionamento ao login aprovado. Teste de cadastro falhou pela ausência do acesso na página inicial; após integração, cadastro e confirmação aprovados.
- Navegador: validação preserva dados, conservação inicia vazia, Cadastrar outro limpa os campos, Cancelar confirma descarte sem gravar, resposta perdida após gravação permite conferir sem duplicar. Tela móvel de 390px sem overflow.
- Revisão Standards: nenhum achado acionável. Revisão Spec: P2 de foco durante correção do formulário. Reproduzido com digitação sequencial: esperava Mesa e o campo recebia apenas M. Corrigido para focar erros somente após envio; regressão e quatro grupos do navegador aprovados.
- A migration foi criada pelo CLI e aplicada somente ao banco local via SQL para iteração. Após os testes, seu histórico local foi registrado com migration repair --local --status applied e conferido por migration list --local: nove versões locais correspondentes ao banco local, incluindo 20261105210516. O campo remote dessa saída do CLI corresponde à conexão local selecionada por --local; não representa consulta cloud. Arquivo novo preserva as migrations anteriores; não houve promoção cloud.

## Diagnóstico de impedimentos nos checks existentes

O sandbox bloqueou inicialmente socket Docker, conexões locais e execução do Chrome; os mesmos checks foram retomados com a autorização técnica apropriada. Node embutido no aplicativo tinha restrição de assinatura para carregar SWC; o Node oficial na versão exigida resolveu o build sem alterar dependências do projeto.

A suíte completa chegou a 43/45 aprovações. Uma falha foi intermitente no teste existente de ordenação por data, que pressupõe relógio crescente durante a criação: os três testes de consulta passaram na repetição isolada. Não se alterou a regra de ordenação nem esse teste para esconder a falha; a causa exata da oscilação de tempo não foi comprovada.

A outra falha foi reproduzível no teste existente de rollback do histórico: sua execução SQL chamava sg incondicionalmente, resultando em spawnSync sg ENOENT no macOS. Plano de correção: tentar Docker diretamente e preservar fallback com sg apenas para Linux que precise do grupo Docker. Manter a constraint temporária, o teste de rollback e a limpeza. Correção delegada ao implementador, sem mudar a regra do produto.

## Resultado final

- Qualidade estática: lint, duplicação, dependências e código não usado aprovados; nenhuma duplicação detectada.
- Typecheck e build de produção aprovados após a correção do foco. Rota dinâmica de cadastro incluída no build.
- Unitários: 13/13 aprovados.
- Suíte completa de integração final: 45/45 aprovados, sem testes pulados, incluindo quatro testes novos da US-025. A falha intermitente de consulta não se repetiu nesta rodada final.
- Navegador: quatro grupos aprovados, incluindo digitação sequencial após erro e perda de resposta real após a gravação. Captura móvel conferida visualmente, sem overflow.
- Advisors e lint SQL nos schemas public/private: aprovados, sem erros encontrados.
- Revisão final Standards: nenhum achado. Spec: P2 corrigido e conferido pelo revisor; nenhum achado restante.
- Helper SQL do teste antigo agora usa Docker diretamente, com fallback de permissão por sg somente no Linux. Teste focado de solicitações: 4/4 aprovado antes da suíte completa.
- Arquivos próprios do subagente conferidos por comparação antes da integração; worktree temporário removido. Alterações preexistentes do usuário preservadas.

As evidências desta etapa comprovam implementação e validação locais. O resultado de CI remoto e promoção da migration após publicação deve ser conferido no cartão. O cartão permanece Em Teste enquanto houver pendência de validação operacional ou aceite humano; merge isolado não conclui a funcionalidade.

## Reprodução

Com Node/npm nas versões fixadas, Docker acessível, Supabase local ativo e configuração local válida:

```sh
npm run check:static
npm run typecheck
npm run build
npm test
npm run test:integration
```

Para o navegador, iniciar a aplicação local na porta 3102 e executar `node tests/browser/us025.mjs` com Playwright disponível. O script aceita PLAYWRIGHT_MODULE, PLAYWRIGHT_CHANNEL e FIXIT_BROWSER_URL; usa Chrome por padrão. No Colima, selecionar seu contexto Docker ou configurar DOCKER_HOST antes dos testes. A aplicação verifica o destino local antes de criar e remover fixtures.
