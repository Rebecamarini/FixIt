# Validação local — US-027

Data: 2026-11-08. Cartão: [US-027](https://trello.com/c/WZCDpZpg). Contrato: [spec](specs/us-027-editar-ou-arquivar-bem-patrimonial.md).

## Escopo entregue

Gestor edita os sete campos cadastrais de bens ativos pelos detalhes, com as mesmas validações do cadastro, ou confirma o arquivamento. Código, autoria e data de cadastro permanecem imutáveis. Edição retorna aos detalhes atualizados; arquivamento retorna à lista preservando busca/página. Não há restauração nem consulta de arquivados.

Conflitos bloqueiam gravações desatualizadas e oferecem comparação com os dados atuais e reaplicação manual. Arquivamento exige nova conferência após edição concorrente; ação já realizada por outro Gestor não duplica registro. Erros preservam preenchimento, cancelamento alterado confirma descarte e resultado incerto preserva a tentativa para recuperação.

Migration 20261108175018 acrescenta versão, tentativas idempotentes, registro atômico de autor/data/antes/depois em tabelas privadas e confirmação original do cadastro. Não concede escrita direta nem consulta do histórico aos usuários. Operação privilegiada privada checa identidade e Gestor ativo; wrapper público é invoker. Preserva migrations anteriores e consultas US-026. Arquivamento não altera solicitações nem remove futuros vínculos; US-028/029 não implementadas.

## Ambiente e integração

Branch integration/us-027, base origin/main 37e67853567b774a97f9da62cc1ac3f372b9ec27. Implementação autorizada em pedido separado via implement-spec. Frentes em worktrees próprias, integradas por cópia conferida por SHA-256, pois commits/push/PR não foram autorizados. Documentos e demais alterações preexistentes mantidos fora da integração de código; arquivo gerado next-env.d.ts regenerado pelas ferramentas Next.js.

Node 24.18.0, npm 11.16.0; Supabase CLI 2.121.0. Banco local existente no contexto Docker colima-fixit-validation. Migration criada via CLI, iterada por SQL local e registrada somente no histórico local; onze migrations conferidas. Upgrade com cadastro preexistente foi exercitado em banco temporário isolado, preservando dados e formato da confirmação sem expor versão; banco temporário removido.

## Evidências

- TDD: integração inicialmente falhou por módulo ausente; passou após implementar a operação pública. Chrome com sessão Gestor confirmou RED inicial por ausência de Editar nos detalhes, seguido de fluxo GREEN completo.
- Unitários: 13/13 aprovados, sem skips.
- Integração completa: 52/52 aprovados, sem skips; inclui quatro novos testes US-027 e regressões US-025/026. Registros de token inválido produzidos por cenários de logout esperados não causaram falhas.
- Qualidade estática completa aprovada: lint, duplicação (zero clones), dependências e código sem uso. Exportação sem uso detectada na primeira execução foi removida.
- Tipos e build padrão de produção com Turbopack aprovados, incluindo rotas de editar/arquivar.
- Chrome real: fluxo básico de edição/arquivamento, cancelamento, validações, no-op, comparação/reaplicação de conflito, confirmação desatualizada e bem já arquivado.
- Chrome real: perda da resposta depois da gravação e repetição da mesma tentativa para editar/arquivar, inclusive edição posterior preservada; campos ficam bloqueados enquanto o resultado é incerto.
- Regressões Chrome US-025 e US-026 aprovadas: cadastro com confirmação recuperável e consulta/busca/paginação/detalhes/falha seguida de recuperação. Locator antigo de alerta US-026 foi tornado específico ao texto esperado para evitar ambiguidade com o anunciador de rotas do Next.js.
- Layout móvel de 390 px conferido visualmente na comparação de conflitos; sem overflow horizontal da página. Fixtures descartáveis removidas e falha SQL temporária da US-026 restaurada.
- Advisors de segurança do banco local: nenhum problema encontrado.

## Revisão

Standards: zero achados na revisão independente. Spec: um achado P2, corrigido pelo implementador. Ao recuperar uma tentativa sem alterações após edição concorrente, a interface permanecia no formulário antigo. Agora consulta detalhes atuais e identifica expressamente a confirmação original recuperada. O teste de navegador adicional confirmou RED antes da correção e GREEN depois. Conferência final da correção pelo agente principal; a segunda chamada ao revisor independente ficou indisponível por limite do serviço.

## Reprodução

Com runtime fixado, Docker e configuração apontando exclusivamente ao banco local, aplicar migrations pendentes somente no banco local e executar:

```sh
npm run check:static
npm run typecheck
npm run build
npm test
npm run test:integration
```

Com aplicação em execução e Playwright disponível, executar com a condição react-server os scripts tests/browser/us025.mjs, us026.mjs, us027.mjs e us027-resilience.mjs. Configurar FIXIT_BROWSER_URL, PLAYWRIGHT_MODULE e PLAYWRIGHT_CHANNEL conforme ambiente. Os scripts verificam destino local antes de preparar fixtures. Usar DOCKER_CONTEXT=colima-fixit-validation neste ambiente. US-026 simula falha SQL de leitura e deve rodar sem outras suítes que dependam da mesma consulta.

## Limites

Entrega e migration apenas locais. Nenhum commit, push, PR, merge ou operação cloud nesta tarefa. Evidências não comprovam implantação compartilhada nem aceite humano. Cartão fica Em Teste para revisão/aceite; publicação e promoção dependem das autorizações aplicáveis. As worktrees temporárias são removidas após conferir a integração; os arquivos permanecem na branch integration/us-027 para revisão.

## Publicação autorizada — 2026-11-09

Após a validação local acima, o usuário autorizou criar/publicar o PR e concluir o merge condicionado aos checks. O commit inclui somente US-027, glossário, spec, testes e este registro; alterações locais preexistentes fora desse escopo ficam preservadas. O resultado do CI, merge e promoção é acompanhado ao vivo no cartão. A autorização de publicação não equivale a aceite funcional humano.
