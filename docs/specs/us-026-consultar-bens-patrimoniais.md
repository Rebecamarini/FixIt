# US-026 — Consultar bens patrimoniais

Cartão: [US-026](https://trello.com/c/9GuoxjTU).
Status: especificação consolidada em 2026-11-05 após grill-with-docs e to-spec. Implementação depende de pedido separado.

## Problem Statement

Gestor e Manutentor precisam identificar os bens da instituição antes de atender manutenção. A US-025 permite cadastrar e conferir o próprio cadastro, mas não fornece inventário consultável. Sem listagem, busca e detalhes, não conseguem localizar os dados atuais dos bens no FixIt.

## Solution

Disponibilizar consulta dos bens ativos para Gestor e Manutentor: listagem de 10 itens por página, cadastros mais recentes primeiro, pesquisa por trecho do código e detalhes em página própria. Preservar o contexto ao voltar à lista e distinguir ausência de resultados de falhas.

## User Stories

1. Como Gestor, quero acessar Consultar bens na página inicial, para consultar o inventário.
2. Como Manutentor, quero acessar a mesma consulta, para identificar o bem atendido.
3. Como Gestor ou Manutentor, quero consultar todos os bens ativos, independentemente de autoria, vínculo ou atribuição de solicitações, para localizar o patrimônio.
4. Como usuário autorizado, quero visualizar os cadastros mais recentes primeiro, para encontrar inclusões recentes.
5. Como usuário autorizado, quero percorrer páginas de 10 bens com total e controles de navegação, para consultar o inventário sem carregar tudo de uma vez.
6. Como usuário autorizado, quero ver código, descrição, localização e conservação na lista, para identificar cada item.
7. Como usuário autorizado, quero pesquisar um trecho do código, para encontrar um ou mais bens correspondentes.
8. Como usuário autorizado, quero confirmar a pesquisa por Pesquisar ou Enter, para controlar quando a consulta acontece.
9. Como usuário autorizado, quero pesquisar sem distinguir caixa e espaços nas pontas, para evitar diferenças de digitação irrelevantes.
10. Como usuário autorizado, quero que símbolos sejam pesquisados literalmente, para não introduzir curingas involuntários.
11. Como usuário autorizado, quero pesquisar com texto vazio para listar todos os ativos, para remover a restrição.
12. Como usuário autorizado, quero que uma nova pesquisa inicie na primeira página, para não perder resultados.
13. Como usuário autorizado, quero abrir detalhes em página própria com link direto, para consultar o bem.
14. Como usuário autorizado, quero ver os dados patrimoniais completos, para conhecer identificação, localização, conservação e datas.
15. Como usuário autorizado, quero ver Não informado nos opcionais vazios, para distinguir ausência de informação.
16. Como usuário autorizado, quero voltar preservando busca e página, para continuar a consulta.
17. Como usuário autorizado, quero distinguir inventário vazio e busca sem resultado, para compreender a situação.
18. Como usuário autorizado, quero tentar novamente após falha preservando o contexto, para recuperar a consulta.
19. Como responsável pelo inventário, quero que bens arquivados não apareçam nem por link direto, para manter esta consulta restrita aos ativos.
20. Como usuário autorizado, quero consultar um bem Péssimo ainda não arquivado, para não confundir conservação com condição ativa.
21. Como responsável pelo inventário, quero impedir acesso de Cliente, visitante e contas sem autorização, para proteger os dados.
22. Como responsável pelo inventário, quero que a consulta não conceda alterações ao Manutentor, para preservar o controle administrativo.

## Implementation Decisions

### Escopo e dados

Ativo significa não arquivado, independentemente da conservação, conforme a US-025 e o glossário. Lista, pesquisa e detalhes abrangem somente ativos. Arquivado e identificador inexistente apresentam bem não encontrado. Não há filtro de arquivados.

Lista mostra código, descrição, localização, conservação e acesso aos detalhes. Detalhes mostram código, descrição, localização, conservação, marca, modelo, data de aquisição e término da garantia. Opcionais vazios aparecem como “Não informado”; autoria e data de cadastro não são apresentadas.

### Busca, ordem e paginação

Pesquisa parcial sobre o código apresentado, sem pesquisar descrição ou outros campos. Ignorar caixa e espaços nas extremidades. Símbolos como % e _ são literais, sem semântica de curingas. Busca vazia lista todos os ativos. Aplicar pelo botão Pesquisar ou Enter, sem consultar a cada tecla.

Lista e pesquisa têm 10 itens por página, total de resultados, páginas numeradas e Anterior/Próxima. Uma nova busca retorna à primeira página. Ordenação fixa por data de cadastro decrescente, com desempate determinístico pelo número do bem decrescente; não ordenar códigos textualmente.

Paginação e filtro são aplicados no servidor/banco. Parâmetros de página inválidos retornam à primeira; página além do total retorna à última disponível, ou à primeira se não houver resultados. Novas consultas refletem os dados atuais, sem prometer uma fotografia estável entre páginas durante cadastros concorrentes.

### Navegação e erros

A inicial oferece Consultar bens para Gestor e Manutentor. Detalhes abrem em página própria. Busca aplicada e página ficam na URL, permitindo recarregar e compartilhar a consulta. Voltar à lista preserva esse contexto; acesso direto aos detalhes sem contexto volta à primeira página sem filtro. Preservar o cadastro existente.

Inventário vazio, pesquisa sem resultado e falha de consulta têm mensagens distintas. Falha oferece tentar novamente preservando busca e página, sem afirmar ausência de bens. Falha de sessão/autorização não se confunde com bem inexistente.

### Módulos, autorização e persistência

Estender o módulo de patrimônio com consulta de lista e detalhes, reutilizando sessão, identidade e padrões visuais existentes. Operações de consulta recebem filtro/página ou identificador do bem; retornam dados autorizados e metadados de paginação, ausência ou falha distinguíveis.

Seguir ADR 0001: acesso pelo servidor Next.js com identidade do usuário, autorização também na fronteira do banco e sem nova API REST interna. Não usar credencial administrativa para consulta. Acrescentar migration de leitura autorizada, preservando migrations anteriores, escrita e confirmação idempotente da US-025.

Gestor e Manutentor válidos consultam todos os ativos, sem depender de vínculos ou atribuição. Cliente, visitante, contas excluídas e provisionamento pendente não recebem inventário. Revalidar autorização a cada operação, inclusive chamadas diretas à API do banco; não compartilhar resultados entre identidades. Não expor identificadores internos de tentativa nem ampliar escrita do Manutentor. A forma SQL concreta deve preservar essas garantias, retornando somente os dados necessários ao produto.

### Critérios de aceite

- CA-01: somente Gestor e Manutentor autorizados consultam todos os ativos por tela, URL e fronteira pública do banco; não há ampliação de escrita.
- CA-02: ativos aparecem independentemente da conservação; arquivados não aparecem em lista, pesquisa nem detalhes.
- CA-03: busca parcial, normalização, símbolos literais, acionamento e busca vazia seguem as regras acima.
- CA-04: lista e pesquisa têm páginas de 10, total e navegação; nova busca retorna à primeira página e a ordenação segue os cadastros mais recentes.
- CA-05: lista e detalhes mostram os campos definidos, com Não informado nos opcionais vazios.
- CA-06: entrada na inicial, detalhes próprios e volta preservando contexto funcionam para ambos os papéis.
- CA-07: ausência de dados e indisponibilidade são distinguíveis; repetir após falha preserva contexto.
- CA-08: consulta não entrega edição, arquivamento, vínculos nem histórico e não apresenta botão de histórico sem função.

## Testing Decisions

Estratégia confirmada pelo usuário durante a entrevista: testar o comportamento público de consulta com banco real local e complementar com fluxo de navegador lista → detalhes → voltar. Priorizar a fronteira pública do módulo e permissões reais; evitar testes de funções privadas ou que espelhem a implementação.

Reutilizar os padrões dos testes existentes de patrimônio da US-025 e da consulta de solicitações da US-010, com identidades reais e banco local. Os fluxos de navegador existentes fornecem referência para sessão, navegação e falhas.

- Cobrir Gestor e Manutentor consultando bens de autores diferentes e sem vínculos; negar Cliente, visitante, contas excluídas, provisionamento pendente e perda de autorização. Conferir acesso direto ao banco e ausência de escrita adicional.
- Criar mais de 10 bens e conferir limite, total, páginas, ordenação, desempate, nova busca e parâmetros inválidos/fora do intervalo.
- Cobrir trechos que encontram vários códigos, caixa, espaços, busca vazia, símbolos literais e ausência de resultados.
- Cobrir ativos nas cinco conservações, arquivados ausentes, link para arquivado/inexistente e opcionais não informados.
- No navegador, conferir entrada pela inicial, dados da lista/detalhes, volta preservando contexto, recarregamento da URL e recuperação de falha de leitura.
- Executar verificações estáticas, tipos, build e testes pertinentes exigidos pelo repositório na implementação. Nenhum teste foi executado nesta especificação.

## Out of Scope

Edição/arquivamento (US-027), vínculo com solicitações (US-028), histórico (US-029), consulta de arquivados, acesso de Cliente, pesquisa em outros campos, ordenação configurável, filtros adicionais, exportação, etiquetas, QR code e integração institucional.

## Further Notes

Esta spec sintetiza as decisões da entrevista encerrada pelo usuário e o pedido de consolidação via to-spec. Substitui o documento provisório. A exigência histórica de acesso ao histórico no CA-02 é retirada deste recorte e permanece na US-029; as demais fontes históricas ficam preservadas no cartão.

A base US-025 já existe. Evidências de integração/promoção estão no histórico do Trello; não constituem implementação nem aceite da US-026. Prontidão para agente significa escopo especificado; não autoriza execução automática, atribuição humana, commit, push ou PR.

O glossário registra Bem ativo. Não há novo ADR, pois as escolhas seguem a arquitetura vigente e as decisões de interação ficam nesta spec.

Em 2026-11-07, o usuário autorizou separadamente a implementação via implement-spec. O resultado local, verificações e limites de publicação estão no registro de validação da US-026; a spec permanece o contrato de aceite.
