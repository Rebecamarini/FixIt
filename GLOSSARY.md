# FixIt

Gestão de solicitações de manutenção e de bens patrimoniais de uma instituição. Termos consolidados nas decisões de escopo e nas histórias do produto.

## Linguagem

**Cliente**:
Papel de usuário voltado a solicitar manutenção e acompanhar somente as próprias solicitações. Gestor e Manutentor também podem solicitar manutenção, sem assumir o papel Cliente.

**Manutentor**:
Usuário responsável pela execução do atendimento das solicitações atribuídas a ele.

**Gestor**:
Usuário que administra solicitações, define prioridade e responsáveis e gerencia o patrimônio e os papéis dos usuários.

**Solicitação**:
Registro de um pedido de manutenção, com autoria, estado atual e histórico.
_Evitar_: Chamado, quando usado como outro nome para o mesmo registro.

**Solicitante**:
Usuário em cujo nome uma solicitação de manutenção é feita. Pode ser diferente do autor do envio quando um Gestor registra o pedido em nome de outro usuário.

**Autor do envio**:
Usuário que efetivamente registra a solicitação. Em pedidos feitos pelo Gestor em nome de outra pessoa, a autoria do envio permanece com o Gestor.

**Bem patrimonial**:
Item individual do inventário da instituição, identificado por código único e passível de vínculo com solicitações. Bens com a mesma descrição e localização continuam sendo itens distintos, cada um com seu próprio código.

**Código patrimonial**:
Identificação única de um bem no inventário, gerada pelo FixIt. Não depende de uma etiqueta ou numeração previamente atribuída pela instituição.
Permanece com o mesmo bem e não é reutilizada, mesmo após arquivamento.

**Bem ativo**:
Bem patrimonial que não foi arquivado. Sua condição ativa independe do estado de conservação; um bem classificado como Péssimo pode continuar ativo.

**Bem arquivado**:
Bem patrimonial retirado do inventário ativo, com dados e vínculos históricos preservados. Seu arquivamento não encerra solicitações de manutenção associadas.

**Localização do bem**:
Descrição do lugar onde um bem patrimonial se encontra, como prédio, sala ou endereço. Não equivale ao setor responsável pelo atendimento de uma solicitação.

**Término da garantia**:
Data até a qual um bem patrimonial possui garantia. Pode ser conhecida mesmo quando a data de aquisição não está disponível.

**Histórico da solicitação**:
Registro cronológico das alterações relevantes de uma solicitação, preservando data e autoria.

**Matrícula**:
Identificação obrigatória e única de um usuário na instituição. Pode conter zeros iniciais e não distingue maiúsculas de minúsculas para identificação.

**Setor**:
Área interna da instituição, selecionada entre os setores cadastrados. O setor do usuário e o setor responsável pelo atendimento são vínculos distintos, mesmo quando apontam para a mesma área.

**Categoria**:
Classificação de uma solicitação, selecionada entre as categorias cadastradas.

**Patrimônios afetados**:
Descrição livre dos bens envolvidos no problema relatado pelo Cliente. Essa descrição não equivale ao vínculo formal com bens do inventário.

**Arquivamento**:
Retirada de um registro das listas ativas, preservando seus dados e vínculos históricos.
_Evitar_: Exclusão, quando puder sugerir remoção definitiva dos dados.
