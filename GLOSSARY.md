# FixIt

Gestão de solicitações de manutenção e de bens patrimoniais de uma instituição. Termos consolidados nas decisões de escopo e nas histórias do produto.

## Linguagem

**Cliente**:
Usuário que solicita manutenção e acompanha somente as próprias solicitações.

**Manutentor**:
Usuário responsável pela execução do atendimento das solicitações atribuídas a ele.

**Gestor**:
Usuário que administra solicitações, define prioridade e responsáveis e gerencia o patrimônio e os papéis dos usuários.

**Solicitação**:
Registro de um pedido de manutenção ou denúncia de dano patrimonial, com autoria, estado atual e histórico.
_Evitar_: Chamado, quando usado como outro nome para o mesmo registro.

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
