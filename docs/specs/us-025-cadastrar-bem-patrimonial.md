# US-025 — Cadastrar bem patrimonial

Status: spec final; entendimento e testes confirmados. Implementação local autorizada pelo usuário com implement-spec em 2026-11-05; validação registrada em docs/validacao-us-025.md.

Cartão: [US-025 — Cadastrar bem patrimonial](https://trello.com/c/4lXN4cDB).
Ator: Gestor. Prioridade: Essencial. Épico: Patrimônio.
Decisões consolidadas em 2026-11-04 (America/Sao_Paulo).

## Problem Statement

O Gestor precisa iniciar e manter o inventário de bens da instituição, inclusive quando ela não possui etiquetas ou códigos patrimoniais prévios. Exigir marca, modelo ou informações de aquisição indisponíveis impede registrar móveis e bens antigos. Sem identificação individual e confirmação confiável, bens iguais podem ser confundidos e falhas de conexão podem provocar duplicação acidental.

A aplicação já possui autenticação, papéis, formulários protegidos e envio de solicitações com controle de tentativas, mas ainda não possui um módulo de inventário. O texto livre “Patrimônios afetados” de uma solicitação não constitui um bem cadastrado nem um vínculo formal.

## Solution

Oferecer ao Gestor um cadastro de bem individual, acessível pela área inicial. Exigir somente descrição, localização e estado de conservação; manter marca, modelo, aquisição e garantia opcionais. O FixIt gera um código permanente, como BEM-000001, e salva o bem ativo.

Após salvar, apresentar o código e os dados efetivamente persistidos. A ação “Cadastrar outro” abre um formulário vazio para um novo bem. A mesma tentativa de envio deve criar no máximo um bem e permitir recuperar sua confirmação após perda de resposta.

“Disponível para consulta e vinculação” significa que o registro estará apto às funcionalidades futuras. Esta entrega não inclui as interfaces dessas histórias.

## User Stories

As histórias abaixo detalham a US-025; não são novos cartões independentes.

1. Como Gestor, quero acessar “Cadastrar bem” na área inicial, para registrar um item no inventário.
2. Como Gestor, quero que o FixIt gere o código automaticamente, para cadastrar bens sem depender de numeração institucional prévia.
3. Como Gestor, quero códigos legíveis no formato BEM-000001, para identificar cada bem.
4. Como Gestor, quero que o código nunca seja reutilizado, mesmo após arquivamento, para preservar a identificação em etiquetas e registros históricos.
5. Como Gestor, quero informar descrição, localização e conservação, para registrar as informações mínimas de um bem.
6. Como Gestor, quero cadastrar marca e modelo quando conhecidos, para complementar a identificação sem bloquear bens antigos ou móveis.
7. Como Gestor, quero descrever a localização livremente, para informar prédio, sala ou endereço sem manter um cadastro prévio de locais.
8. Como Gestor, quero escolher entre Novo, Bom, Regular, Ruim e Péssimo, para classificar a conservação.
9. Como Gestor, quero cadastrar um bem em estado Péssimo como ativo no inventário, para registrar sua existência sem presumir funcionamento ou arquivamento.
10. Como Gestor, quero informar a data de aquisição quando conhecida, para preservar essa informação.
11. Como Gestor, quero informar “Garantia até” independentemente da aquisição, para registrar a data de término mesmo sem todos os dados históricos.
12. Como Gestor, quero cadastrar garantia já vencida, para registrar bens antigos.
13. Como Gestor, quero receber mensagens sobre campos e datas inválidos sem perder o preenchimento, para corrigir o cadastro.
14. Como Gestor, quero registrar bens com dados iguais em cadastros distintos, para inventariar cada uma das cadeiras ou equipamentos idênticos.
15. Como Gestor, quero visualizar o código e os dados salvos, para conferir o resultado.
16. Como Gestor, quero iniciar outro cadastro com formulário vazio, para registrar o próximo bem.
17. Como Gestor, quero confirmar o descarte ao cancelar um formulário alterado, para evitar perda acidental do preenchimento.
18. Como Gestor, quero repetir uma tentativa após falha de conexão sem criar outro bem, para obter uma confirmação confiável.
19. Como Gestor, quero que duplo clique ou envios simultâneos da mesma tentativa não dupliquem o bem, para evitar cadastros acidentais.
20. Como responsável pelo inventário, quero que Cliente, Manutentor, visitante e contas sem autorização não cadastrem bens, para manter o controle de acesso.

## Implementation Decisions

### Dados e validações

| Campo | Obrigatoriedade | Regra |
| --- | --- | --- |
| Código patrimonial | Gerado pelo FixIt | Prefixo BEM- e sequência crescente, inicialmente com seis dígitos |
| Descrição | Obrigatório | Até 500 caracteres |
| Localização | Obrigatório | Texto livre de até 200 caracteres, sem vínculo obrigatório com setor |
| Estado de conservação | Obrigatório | Novo, Bom, Regular, Ruim ou Péssimo; seleção inicial vazia |
| Marca | Opcional | Até 100 caracteres |
| Modelo | Opcional | Até 100 caracteres |
| Data de aquisição | Opcional | Data válida, sem aceitar dia futuro |
| Garantia até | Opcional | Data válida de término, inclusive já vencida |

Remover espaços nas extremidades dos textos. Campos obrigatórios contendo apenas espaços são inválidos; opcionais vazios representam informação não disponível. Aquisição e garantia podem ser informadas separadamente. Quando ambas existirem, o término da garantia deve ser igual ou posterior à aquisição. As datas representam dias, sem horário; usar a data corrente da aplicação para a comparação, com comportamento consistente no servidor e no formulário.

A conservação é informada pelo Gestor; não determina automaticamente funcionalidade, possibilidade de reparo ou arquivamento. Todo cadastro válido nasce ativo, inclusive um bem classificado como Péssimo. Ativo significa não arquivado.

### Identificação e unidade do inventário

Cada cadastro representa um bem individual. Dados iguais não geram bloqueio nem confirmação por semelhança; tentativas distintas podem criar bens idênticos, cada um com seu código.

O código é gerado no servidor/banco e permanece com o mesmo bem. Não aceitar código fornecido pelo navegador. Garantir unicidade inclusive com cadastros concorrentes e reservar os códigos após arquivamento. Saltos na sequência são permitidos, inclusive quando uma tentativa falha; números pulados não serão reaproveitados e não representam bens cadastrados. O código não é uma contagem do inventário.

### Módulos e persistência

Acrescentar um módulo de patrimônio com página protegida, formulário, operação de cadastro e confirmação, reutilizando identidade, sessão e padrões visuais existentes. Acrescentar estrutura persistente para os bens e o controle das tentativas em uma migration nova, preservando as anteriores.

Manter a arquitetura do ADR 0001: operações pelo servidor Next.js com identidade do usuário e autorização também no banco. Não é necessária outra API REST interna nem capacidade administrativa do Auth para cadastrar bens.

A operação recebe os campos do cadastro e a identificação da tentativa, vinculada ao usuário que abriu o formulário. Retorna confirmação com código e dados persistidos, erros de campos, recusa de acesso ou resultado incerto recuperável. O navegador não define autoria, código nem condição ativa.

Persistir atomicamente o bem ativo e a identificação da tentativa. A mesma tentativa pertence à mesma identidade e produz no máximo um bem. Reenvio de tentativa já concluída recupera o resultado original, sem criar nem alterar outro registro. “Cadastrar outro” inicia uma tentativa diferente.

### Autorização

Somente Gestor autenticado e autorizado pode abrir o cadastro, gravar e recuperar a confirmação da própria tentativa. Revalidar identidade e papel em cada operação. Cliente, Manutentor e visitante não podem cadastrar por URL direta, operação manipulada ou acesso direto ao banco. Outra conta não pode assumir a tentativa nem recuperar sua confirmação.

A leitura necessária para confirmar o próprio cadastro não antecipa a consulta geral prevista na US-026.

### Interação, erros e cancelamento

1. Formulário inicia vazio, inclusive conservação, sem rascunho persistido.
2. Salvar valida os dados e aponta erros nos campos, preservando o preenchimento.
3. Durante o envio, impedir novos cliques; a garantia contra duplicação também deve existir na persistência.
4. Em falha com resultado incerto, informar que o bem pode ter sido salvo e oferecer conferência/reenvio da mesma tentativa. Preservar o conteúdo original; não iniciar automaticamente outra criação nem permitir que a tentativa incerta seja convertida silenciosamente em outro cadastro.
5. Sucesso mostra código e dados efetivamente salvos e oferece “Cadastrar outro”.
6. Cancelar antes do envio confirma descarte quando houver alterações; descarta sem salvar bem ou rascunho. Um bem já salvo não é desfeito por cancelamento posterior. Em resultado incerto, não apresentar descarte como garantia de desfazer uma gravação.

### Critérios de aceite

- CA-01: somente Gestor autorizado cadastra; acessos e operações diretas de outros papéis ou visitante são rejeitados sem gravação.
- CA-02: obrigatoriedade, limites, remoção de espaços e campos opcionais seguem a tabela e as validações acima.
- CA-03: conservação aceita exclusivamente os cinco estados definidos; localização é livre e conservação inicia sem seleção.
- CA-04: aquisição futura, datas inválidas e garantia anterior à aquisição são rejeitadas; garantia vencida e datas informadas separadamente são aceitas.
- CA-05: cadastro válido cria um bem ativo com código automático único e permanente; concorrência não repete códigos e saltos são aceitos.
- CA-06: tentativas distintas com dados iguais criam bens distintos, sem alerta por semelhança.
- CA-07: confirmação apresenta os dados persistidos; “Cadastrar outro” abre formulário vazio e nova tentativa.
- CA-08: duplo clique, concorrência e reenvio após perda de resposta da mesma tentativa produzem um único bem e recuperam a confirmação original; outra conta não pode assumir a tentativa.
- CA-09: erros preservam o preenchimento; cancelamento anterior ao envio confirma descarte quando necessário e não salva bem nem rascunho.
- CA-10: cadastro não exige integração institucional nem entrega consulta geral, edição, arquivamento, vínculo ou histórico.

## Testing Decisions

Estratégia confirmada pelo usuário no to-spec: usar o fluxo completo de cadastro e confirmação como ponto principal, complementado por integração real para autorização, concorrência e reenvio.

Um bom teste verifica comportamento observável: resultado apresentado ao Gestor, registro persistido, ausência de gravação indevida e ausência de duplicação. Evitar testes que reproduzam funções privadas ou dependam da organização interna do módulo.

- Testar o módulo de patrimônio pelo fluxo público de cadastro e confirmação, com sessão real e banco local real. Reutilizar os utilitários de identidades e os padrões de teste existentes.
- Usar como referência os testes de integração do envio de solicitações (US-009), que cobrem tentativas concorrentes, reenvio, troca de identidade e recusa na fronteira pública do banco.
- Usar como referência o teste de navegador da US-009, que simula gravação real seguida de perda da resposta e verifica que o reenvio não cria outro registro.
- Cobrir cadastro mínimo e completo, estados de conservação, campos ausentes, espaços, limites nos valores extremos e acima deles, datas inválidas, aquisição futura, garantia vencida e comparação entre as duas datas.
- Cobrir bem Péssimo salvo ativo, bens com dados iguais em tentativas distintas e geração de códigos únicos em cadastros simultâneos.
- Cobrir sessão ausente, Cliente, Manutentor, outra identidade, perda de autorização e tentativa de manipular campos controlados pelo servidor; conferir também proteção do acesso direto ao banco.
- Simular perda de resposta depois da gravação, reenviar a mesma tentativa e comprovar um único bem e a recuperação dos mesmos dados.
- Validar por navegador o acesso pela área inicial, mensagens junto aos campos, preservação do preenchimento, confirmação de descarte e “Cadastrar outro”.
- Conferir persistência por nova leitura e executar as verificações estáticas, tipos, build e testes exigidos pelo repositório na implementação. A criação desta spec não constitui execução ou aprovação desses testes.

## Out of Scope

- US-026: listagem, pesquisa por código e consulta geral de detalhes.
- US-027: edição e arquivamento; a reserva permanente do código já orienta essa entrega futura.
- US-028: vínculo formal entre bens e solicitações.
- US-029: histórico do bem.
- Cadastro de locais, seleção obrigatória de setor, importação e integração institucional.
- Impressão de etiquetas, código de barras, QR code, cadastro em lote e numeração externa alternativa.
- Rascunhos persistentes, deduplicação por semelhança e gestão contábil ou de depreciação.

## Further Notes

Esta spec sintetiza a entrevista aprovada e substitui o registro provisório no mesmo documento. As decisões e sua autoria permanecem no histórico de comentários do cartão.

As escolhas do usuário prevalecem sobre os critérios históricos: marca e modelo deixam de ser obrigatórios; o código é gerado automaticamente; disponibilidade para consulta/vinculação não amplia a US-025 para as histórias seguintes. Os demais campos opcionais continuam no formulário.

A avaliação inicial de prontidão do cartão é histórica: as lacunas de escopo e critérios foram resolvidas nesta entrevista. A tarefa ainda não possui implementação nem aceite funcional comprovado. Atribuição permanece sem responsável até definição da equipe.

Não há novo ADR: as escolhas seguem a arquitetura vigente e estão documentadas nesta spec e no glossário. O estado ready-for-agent registrava especificação suficiente; o pedido separado com implement-spec autorizou a implementação local nesta sessão. Depois da validação, em 2026-11-05, o usuário autorizou a publicação do PR e o merge condicionado à aprovação dos checks. Evidências de publicação e promoção ficam no cartão.
