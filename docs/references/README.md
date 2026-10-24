# Contexto do FixIt

Importado em **2026-10-17** da
[pasta do Drive](https://drive.google.com/drive/folders/19RsCtfuTNRDuvkRHMVTOGFHQsQk8NxgZ).
Estas cópias não têm sincronização automática. Consulte as fontes antes de
assumir que uma tarefa ou decisão continua atual.

## Ordem de leitura

1. No [Trello](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit), leia
   [DEC-001 — escopo](https://trello.com/c/iQhgWOan),
   [DEC-002 — Sprint 1](https://trello.com/c/sA10ilUi) e o cartão da tarefa.
2. A [cópia dos 38 cartões abertos](trello/backlog-2026-10-17.md) permite consulta offline, agrupada nas 10 listas.
3. O [Trabalho 02](drive/trabalho-02.md) explica a evolução para Next.js e Supabase.
4. O [Trabalho 01 editado](drive/trabalho-01-editado.md) contém as histórias e critérios de aceitação.
5. A [arquitetura original em PDF](drive/arquitetura-original.pdf) preserva diagramas, protótipos e requisitos históricos.

## Fontes importadas

| Cópia | Fonte | Uso |
| --- | --- | --- |
| `drive/trabalho-01-editado.md` | [Trabalho 01-Editado](https://docs.google.com/document/d/1O275g2lke_M2Ve4ghh0_PStPR6ynMKjsXm8GFexG20s/edit) | Histórias, critérios e atualização para Supabase |
| `drive/trabalho-02.md` | [Trabalho 02 — CS](https://docs.google.com/document/d/1uxobkjnoZNWWNNLMemSuqC0e1liynxe4bRn7kBHi2CE/edit) | Justificativa técnica, Next.js, Auth, RLS, triggers e Storage |
| `drive/arquitetura-original.pdf` | [Arquitetura de Software do FIXIT (2).pdf](https://drive.google.com/file/d/1I5cV1HBkDOD-SeDdKiYvBPb7Tq6SdB5m/view) | Diagramas e rastreabilidade histórica |
| `trello/backlog-2026-10-17.md` | [Board do produto](https://trello.com/b/SsT0I7Di/backlog-do-produto-fixit) | Descrições e links dos cartões abertos; sem arquivados |

Os Google Docs foram exportados em Markdown, com as imagens incorporadas
quando presentes. O PDF foi baixado no formato original. Dados acadêmicos dos
autores presentes nos originais permanecem nas cópias.

## Divergências antes de implementar

- Em 2026-10-24, o usuário restringiu as solicitações à manutenção, retirando denúncia de dano patrimonial como finalidade independente. O [ADR 0002](../adr/0002-escopo-manutencao.md) prevalece sobre a redação histórica da US-006 e das fontes importadas. Consulte-o ao definir o escopo de novas specs e implementações.
- Na mesma entrevista, confirmou criação pelos três papéis e seleção de outro solicitante pelo Gestor, preservando a autoria real do envio. O [ADR 0003](../adr/0003-solicitante-e-autor-do-envio.md) orienta US-006/007/009 e as futuras consultas; prevalece sobre a restrição histórica de criação somente por Cliente. A implementação dessa ampliação ainda está pendente.
- O README antigo descrevia Spring Boot e React/Flutter separados. O usuário confirmou Next.js com Supabase em 2026-10-17; a arquitetura vigente está no [ADR 0001](../adr/0001-nextjs-supabase.md) e no [README da raiz](../../README.md).
- A redação da DEC-001 exclui APIs e armazenamento externos, enquanto o Trabalho 02 propõe Supabase gerenciado. Em 2026-10-17, o usuário confirmou Supabase como infraestrutura do próprio FixIt, permitindo Auth, banco e futuramente Storage. A exceção está registrada no ADR 0001; o cartão ainda não foi atualizado.
- BCE/Singleton e a comunicação direta navegador–Supabase nos trabalhos anteriores são históricos. O usuário confirmou operações de dados pelo servidor Next.js e adaptação de BCE por responsabilidades, sem classes/Singleton obrigatórios. Consulte o [registro da entrevista](../base-tecnica.md); as cópias importadas permanecem preservadas.
- DEC-002 distribui frentes completas entre João (usuários/autenticação), Paulo (criação/envio) e Rebeca (consulta/autorização). Alguns membros dos cartões divergem do responsável escrito na descrição. Confirme a atribuição no início da tarefa.
- DEC-002 diz que as datas estão a definir, embora existam vencimentos nos cartões. Não trate esses vencimentos como cronograma confirmado.
- Na Sprint 1, autorização e histórico são entregas parciais; anexos ficam para sprint futura e notificações ao Gestor permanecem pendentes com US-012. Leia o recorte da sprint além da história completa.

DEC-001 afirma que decisões do usuário prevalecem sobre requisitos conflitantes
das versões anteriores. Explicite conflitos entre fontes atuais antes de usá-los
como requisitos de implementação.

## Arquivos não importados

- Os dois backups do Trabalho 02: versões intermediárias.
- “FixIt — Conceitos-chave do Supabase (revisão para apresentação)”: revisão conceitual fora da seleção solicitada.
- [Trabalho 01 — CS Original](https://docs.google.com/document/d/1dBAd0Nzm06E7mL9re4VW0ncBgtveNPefQf7K6b4zD_A/edit): mantém Spring Boot e se sobrepõe ao editado; foi comparado para identificar a evolução, sem duplicá-lo localmente.

## Uso pela equipe

Os arquivos e as instruções em `AGENTS.md` são compartilhados pelo Git.
Cada pessoa precisa instalar as skills e conectar Drive/Trello no próprio agente
para consultar fontes ao vivo. As cópias locais podem ser lidas sem conectores.
