# US-027 — Editar ou arquivar bem patrimonial

Cartão: [US-027](https://trello.com/c/WZCDpZpg).
Status: especificação consolidada em 2026-11-08 após entrevista grill-with-docs encerrada pelo usuário e pedido expresso de to-spec. Implementação exige pedido separado.

## Problem Statement

O Gestor já cadastra e consulta bens, mas não consegue corrigir os dados ou retirar itens do inventário ativo. Precisa manter o inventário correto sem perder a identidade do bem, seus dados ou futuros vínculos e sem sobrescrever o trabalho de outro Gestor.

## Solution

Oferecer Editar e Arquivar nos detalhes dos bens ativos para Gestor. Permitir correção dos dados cadastrais, confirmação explícita do arquivamento, revisão de conflitos e recuperação de tentativas com resposta perdida. Preservar dados e registrar alterações sem entregar uma tela de histórico.

## User Stories

1. Como Gestor, quero editar os dados cadastrais de um bem ativo, para corrigir e manter o inventário.
2. Como Gestor, quero manter código, autoria e data do cadastro inalterados, para preservar a identidade e a origem do bem.
3. Como Gestor, quero abrir a edição pelos detalhes, para conferir qual bem estou alterando.
4. Como Gestor, quero encontrar os campos preenchidos com os dados atuais, para editar a partir do cadastro existente.
5. Como Gestor, quero receber validações equivalentes às do cadastro, para manter informações consistentes.
6. Como Gestor, quero remover valores opcionais quando necessário, para corrigir informações que não estão disponíveis.
7. Como Gestor, quero ver erros junto aos campos e manter o preenchimento, para corrigir sem refazer o trabalho.
8. Como Gestor, quero cancelar com confirmação de descarte se houver alterações, para evitar perda acidental do preenchimento.
9. Como Gestor, quero ver os detalhes atualizados após salvar, para conferir o resultado persistido.
10. Como Gestor, quero comparar meus valores com os atuais em caso de conflito, para reaplicar manualmente apenas as mudanças desejadas.
11. Como Gestor, quero ter gravações desatualizadas bloqueadas, para não sobrescrever alterações de outro Gestor.
12. Como Gestor, quero confirmar o arquivamento conferindo código e descrição, para evitar arquivar o item errado.
13. Como Gestor, quero cancelar o arquivamento sem alterar dados, para desistir com segurança.
14. Como Gestor, quero reconfirmar o arquivamento se os dados mudarem, para decidir com base na versão atual.
15. Como Gestor, quero ser informado quando outro Gestor já arquivou o bem, para entender por que a ação não será repetida.
16. Como Gestor, quero retornar à lista preservando busca e página após arquivar, para continuar a consulta do inventário.
17. Como Gestor, quero retirar o bem arquivado da consulta ativa sem apagar seus dados, para preservar o patrimônio histórico.
18. Como Gestor, quero arquivar mesmo com solicitação aberta sem encerrá-la, para separar inventário de atendimento.
19. Como Gestor, quero recuperar o resultado de uma tentativa após perda de resposta, para evitar repetir alterações.
20. Como Gestor, quero salvar valores equivalentes sem gerar alteração artificial, para manter registros relevantes.
21. Como Gestor, quero preservar as confirmações antigas de cadastro sem reverter edições, para manter os contratos existentes.
22. Como responsável pelo inventário, quero registrar autor, data e valores anteriores/novos das alterações, para preservar sua rastreabilidade.
23. Como responsável pelo inventário, quero impedir alterações por Manutentor, Cliente e identidades não autorizadas, para proteger o patrimônio.
24. Como Manutentor, quero continuar consultando os bens ativos sem receber ações de alteração, para identificar o patrimônio durante o atendimento.

## Implementation Decisions


### Campos editáveis

O Gestor pode editar todos os dados cadastrais de um bem ativo: descrição, localização, estado de conservação, marca, modelo, data de aquisição e término da garantia. Código patrimonial e autoria permanecem imutáveis. Aplicam-se as mesmas obrigatoriedades, limites e validações definidas na [US-025](us-025-cadastrar-bem-patrimonial.md).

### Reversibilidade do arquivamento

Arquivar exige confirmação explícita e retira o bem da consulta ativa, preservando seus dados. Restauração e consulta de arquivados ficam fora da US-027. Isso delimita esta entrega, sem declarar que uma restauração futura seja proibida.

### Conflito entre alterações

Se outro Gestor alterar o bem após a abertura da edição, bloquear a gravação desatualizada, avisar que o bem mudou e preservar o preenchimento para revisão com os dados atuais. Se o bem tiver sido arquivado, a edição também é bloqueada e nunca o reativa.

Se outro Gestor editar o bem entre a abertura da confirmação e o arquivamento, bloquear a confirmação desatualizada e exigir nova conferência dos dados atuais antes de arquivar.

### Entrada das ações

Editar e Arquivar ficam nos detalhes do bem, somente para Gestor. A edição abre em página própria; arquivamento exige confirmação. Manutentor permanece com acesso apenas à consulta, sem novas permissões de alteração.

Após salvar edição, mostrar detalhes atualizados e confirmação de sucesso. Após arquivar, voltar à lista e confirmar sucesso. Preservar busca e página de origem; ajustar página quando necessário conforme a consulta US-026.

### Confirmação do arquivamento

Mostrar código e descrição do bem, avisando que sairá da consulta ativa e que não há restauração nesta entrega. Oferecer Cancelar e Arquivar. Não exigir motivo nem digitação do código.

### Cancelamento da edição

Cancelar com alterações exige confirmação de descarte; confirmado, voltar aos detalhes sem salvar. Sem alterações, voltar diretamente aos detalhes.

### Revisão de conflito de edição

Mostrar os valores preenchidos pelo Gestor e os dados atuais para comparação. Permitir abrir a versão atual e reaplicar manualmente as mudanças desejadas antes de salvar. Não mesclar ou sobrescrever automaticamente. A comparação de dados atuais depende de o bem continuar ativo e de o usuário continuar autorizado.

### Resposta perdida

Quando o resultado for incerto após falha de conexão, informar que a ação pode ter sido concluída e permitir conferir ou repetir a mesma tentativa, recuperando o resultado sem aplicar a ação novamente nem sobrescrever mudanças posteriores. Abrange edição e arquivamento.

### Registro das alterações

Registrar autor, data e valores anteriores/novos de cada alteração efetiva, incluindo arquivamento. Gravação e registro devem representar a mesma alteração, sem duplicação no reenvio da tentativa. Não entregar tela de histórico nesta US. O histórico de alterações cadastrais não se confunde com a consulta de solicitações e manutenções associadas prevista na US-029.

### Relação com solicitações

Um bem pode ser arquivado mesmo com solicitação aberta vinculada. O arquivamento não encerra nem altera solicitações e não remove vínculos. US-028/029 deverão preservar essa regra ao implementar vínculos e sua consulta histórica; esta US não implementa essas funcionalidades.

### Gravação sem mudança

Salvar valores efetivamente iguais aos atuais informa que não há alterações, sem nova versão nem evento de histórico. Comparar após as normalizações do cadastro; espaços normalizados e representações equivalentes de opcionais vazios não são alterações.

### Bem já arquivado em uma confirmação aberta

Se outro Gestor tiver arquivado o bem enquanto a confirmação estava aberta, informar que já está arquivado e voltar à lista. Não criar novo evento nem atribuir o arquivamento ao segundo Gestor. Isso não amplia a consulta geral de arquivados nem altera o comportamento de links diretos da US-026; verificar autorização também nesse retorno.

### Validação e falhas

Erros de validação e falhas temporárias preservam o preenchimento. Indicar erros junto aos campos e permitir nova tentativa, sem rascunho persistente nem gravação parcial. Resultados incertos seguem a recuperação da mesma tentativa, sem iniciar silenciosamente outra operação.

### Contratos existentes a preservar

- Código permanente e nunca reutilizado, inclusive após arquivamento.
- Arquivamento preserva dados e vínculos históricos; não é remoção definitiva.
- Consulta US-026 abrange apenas ativos, inclusive nos detalhes por link direto.
- Recuperação da confirmação de cadastro da US-025 deve continuar funcionando.

### Autorização e integridade

Somente Gestor ativo e autorizado edita e arquiva. Revalidar identidade em cada operação, inclusive na recuperação de tentativas e comparação de conflitos. Negar visitante, Cliente, Manutentor, contas excluídas e provisionamento pendente, também na fronteira pública do banco. Perda de autorização não permite gravação nem recuperação de dados protegidos. Tentativas pertencem ao autor e não podem ser assumidas por outra conta.

Estender o módulo de patrimônio com operações de edição e arquivamento que recebem identificador, versão conferida, dados editáveis quando aplicável e identificação da tentativa. Distinguir sucesso, ausência de mudança, conflito, indisponibilidade do bem, falta de autorização e falha. A persistência deverá suportar controle de versão, recuperação de tentativas e registro atômico das alterações, preservando migrations existentes. A forma SQL concreta será definida na implementação, sem nova API REST interna.

Seguir ADR 0001: operações pelo servidor Next.js com identidade do usuário e proteção no banco. Link direto de edição de bem arquivado/inexistente não oferece formulário e informa indisponibilidade, sem ampliar consulta de arquivados. Preservar data original do cadastro, além de código e autoria.

Alteração e registro de histórico são atômicos. Usuários não podem forjar ou alterar o histórico. Impedir cliques repetidos durante envio e garantir persistência sem duplicação. Recuperar o resultado original de uma tentativa não o apresenta como versão atual caso haja mudanças posteriores; nova leitura segue permissões e condição ativa atuais.

### Critérios de aceite

- CA-01: somente Gestor autorizado altera/arquiva por tela, URL e fronteira pública do banco; demais identidades são rejeitadas sem gravação ou exposição indevida.
- CA-02: edição inicia com dados atuais nos sete campos confirmados, respeita validações da US-025 e preserva código, autoria e data de cadastro.
- CA-03: ações aparecem nos detalhes para Gestor; sucesso da edição retorna aos detalhes e arquivamento à lista, com confirmação e contexto preservado.
- CA-04: confirmação de arquivamento mostra código, descrição e avisos; cancelar não altera o bem.
- CA-05: arquivado desaparece de lista, busca e detalhes da US-026, não admite edição e preserva código, dados e vínculos.
- CA-06: edição desatualizada é bloqueada com preenchimento preservado e comparação/reaplicação manual; arquivamento após edição concorrente exige nova confirmação.
- CA-07: arquivamento já realizado por outro Gestor é informado sem novo evento ou mudança de autoria.
- CA-08: erros preservam preenchimento; cancelamento de edição alterada confirma descarte; não há gravação parcial nem rascunho persistente.
- CA-09: duplo clique, concorrência e resposta perdida da mesma tentativa recuperam seu resultado sem duplicar alteração/evento ou sobrescrever mudanças posteriores; outra conta não assume a tentativa.
- CA-10: alterações efetivas guardam autor, data e valores anteriores/novos atomicamente; valores normalizados iguais informam ausência de alterações sem nova versão/evento.
- CA-11: arquivamento não encerra solicitações nem remove vínculos; vínculos e consulta de histórico permanecem fora da entrega.
- CA-12: cadastro e recuperação das confirmações da US-025 continuam funcionando após edição/arquivamento, sem reverter mudanças posteriores.

## Testing Decisions

Confirmada pelo usuário: integração com banco local real e fluxo de navegador. Priorizar a fronteira pública do módulo de patrimônio, com operações de edição/arquivamento e recuperação de tentativas sob identidade real. Um bom teste verifica comportamento observável, dados persistidos, rejeição de gravação indevida e ausência de duplicação; não espelha funções privadas. Reutilizar os padrões de integração e navegador das US-025/026 e de recuperação de resposta perdida da US-009. Nenhum teste foi executado nesta especificação.

- Integração: todos os papéis, sessão ausente, contas excluídas, provisionamento pendente, perda de autorização, operações diretas no banco e isolamento de tentativas.
- Integração: campos, normalizações, obrigatoriedades, limites, datas, cinco conservações e imutabilidade; gravação sem alteração efetiva.
- Integração: dois Gestores editando, edição contra arquivamento nas duas ordens, confirmação desatualizada e arquivamentos concorrentes; atomicidade de alteração/histórico e proteção dos registros.
- Integração/navegador: gravação seguida de perda de resposta, reenvio e mudança posterior preservada; regressão da confirmação US-025.
- Navegador: editar/salvar, cancelar com/sem alterações, erros, falha temporária, comparação/reaplicação de conflito e confirmar/cancelar arquivamento; retorno com busca/página, ausência de ações para Manutentor e layout móvel.
- Na implementação futura, executar qualidade estática, tipos, build e testes pertinentes do repositório.

## Out of Scope

Restauração, consulta/edição de arquivados, tela de histórico cadastral, implementação das US-028/029, alteração de código/autoria, motivo obrigatório, rascunhos persistentes, mesclagem automática e remoção definitiva.

## Further Notes

O usuário encerrou a entrevista e solicitou to-spec. Esta especificação consolida as decisões confirmadas e substitui o registro provisório. Prontidão para agente não autoriza implementar, criar commits, push ou PR; a execução depende de pedido separado.

Glossário atualizado com Bem arquivado. Não há novo ADR: as escolhas seguem a arquitetura vigente e ficam registradas nesta spec.

Em pedido separado de 2026-11-08, o usuário autorizou a implementação local via implement-spec. O estado da execução e as evidências são acompanhados no cartão e no registro de validação da US-027; a spec permanece o contrato de aceite. Não foram autorizados commits, push ou PR.
