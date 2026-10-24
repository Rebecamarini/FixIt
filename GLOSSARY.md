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
Item do inventário da instituição, identificado por código único e passível de vínculo com solicitações.

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
