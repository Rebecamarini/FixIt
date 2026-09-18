# Arquitetura do FixIt

### 1. Backend — Spring Boot (Java)

Responsável pelo desenvolvimento do backend, utilizando arquitetura em camadas, injeção de dependências e menor quantidade de código repetitivo.

### 2. Frontend — React e Flutter

* **React:** Dashboard Web/Desktop dos Gestores.
* **Flutter:** Aplicativo mobile dos Clientes, incluindo acesso à câmera para anexar evidências.

### 3. Design Patterns

* **BCE:** Organização das classes em Interface, Controle e Entidade.
* **Singleton:** Garante uma única instância de serviços principais.
* **DTO:** Transporta dados entre as interfaces e o backend sem expor diretamente as entidades.

### 4. Banco de Dados e Integração

* **PostgreSQL:** Armazena solicitações, histórico e dados patrimoniais.
* **REST APIs:** Comunicação entre sistemas utilizando HTTP e JSON.
