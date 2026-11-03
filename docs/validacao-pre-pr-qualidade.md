# Revalidação pré-PR da consolidação

Nova validação solicitada pelo usuário, encerrada em 2026-11-03. O destino
`main` foi escolhido explicitamente, incluindo a consolidação anterior.
Referências: [consolidação](https://trello.com/c/Wve1fotA),
[qualidade](https://trello.com/c/hRLkCOuP) e
[HTTP 429](https://trello.com/c/e6Ukr9iC).

## Resultado local

| Verificação | Resultado |
| --- | --- |
| Instalação limpa pelo lockfile | `npm ci` aprovado, Node 24.18.0/npm 11.16.0 |
| `npm run check:static` | Aprovado; lint, duplicidade, dependências e Knip |
| Banco local vazio até versão 20261025175916 | Reset aprovado em stack descartável separada |
| `node tests/us009-migration.mjs` | Aprovado: solicitação legada e histórico preservados |
| `supabase migration up --local` | Migration US-009 aplicada com sucesso |
| `npm run verify` final | Lint, tipos, build, 13 unitários e 41 integrações aprovados; zero falhas/skips |
| Revisão integral do diff contra `origin/main` | Standards e Spec: zero achados concretos |
| `git diff --check` | Aprovado |

[Logs da nova execução](evidencias/qualidade-consolidacao/pre-pr/).
As conferências de navegador registradas no
[relatório principal](validacao-qualidade-consolidacao.md) usaram a mesma árvore
de código, nos três papéis e nas larguras 390/1440 px. Esta nova rodada acrescenta
a reconstrução do CI desde banco vazio; não é alegada uma nova execução daqueles
roteiros de navegador.

## Ambiente e primeira falha

A reprodução usou uma cópia temporária completa do checkout, incluindo arquivos
novos, com dependências reinstaladas. Os 69 arquivos de código/testes/scripts e
migrations foram comparados byte a byte com o checkout de origem, sem diferenças.
Pacotes, lockfile, versões, configurações estáticas e workflow também coincidem.

Para preservar os dados anteriores, somente na cópia temporária o projeto local
Supabase recebeu o nome `fixit-quality-ci`. Um adaptador externo encaminhou o
nome fixo `supabase_db_fixit` dos testes para o contêiner dessa stack; o adaptador
macOS de `sg` executou o mesmo comando sem troca de grupo. Os arquivos dos testes
não foram alterados. Configuração e credenciais permaneceram somente locais;
nenhuma operação cloud foi executada.
Ao encerrar, somente a stack descartável `fixit-quality-ci` foi removida; os
dados da stack anterior `fixit` foram preservados e a VM dedicada foi parada.

A primeira execução terminou com 40 integrações aprovadas e uma falha na
comparação entre data criada pelo banco e relógio do host. O log registra longas
pausas, com duração total superior a quatro horas. Não foi alterada a tolerância
nem o código para obter aprovação. Uma medição posterior encontrou o horário do
banco dentro do intervalo do host; o teste específico passou em cerca de três
segundos. O `verify` inteiro foi então repetido com `caffeinate -i`, impedindo
suspensão por inatividade, e as 41 integrações passaram em aproximadamente 85
segundos. A interrupção/retomada do ambiente é a causa provável da primeira
falha; não há medição do desvio exato durante ela para afirmar uma causa mais
específica. O log que falhou está preservado junto do resultado final.

## O que o PR para main inclui

A consulta remota confirmou `main` em `db49839b86acc1359ac8a60cee3ff3f60b0da22b`
e a integração em `8cdf78341644be0436e4c2ebdf54a0655cb8eaeb`.
O histórico da integração está 18 commits à frente e dois atrás da main; esses
dois são merges das entregas anteriores. O PR completo leva US-009, validação
final US-002, SPEC-002 e suas ferramentas/migration, além da correção HTTP 429
e das refatorações locais. Preserva US-010 e não inclui a branch US-011.

O resultado local cobre esse código completo, não apenas a redução das métricas.
A revisão foi ampliada para o diff contra a main e os arquivos novos. Nenhum
merge local foi executado para esta conferência.

## Limites da publicação

Não é correto afirmar que abrir este PR deixa todo o projeto resolvido:

- O CI remoto precisa executar sobre o commit efetivamente publicado. O estado
  de conflitos e os checks do PR devem ser conferidos no GitHub antes do merge.
- A [execução atual da main](https://github.com/Rebecamarini/FixIt/actions/runs/41235253311)
  teve **CI aprovado** e **promoção de migrations reprovada**. O log do job
  `124638489167` informa que a rede não suporta IPv6 e orienta configurar conexão
  IPv4. Este diff não corrige essa promoção; a pendência continua no
  [cartão separado](https://trello.com/c/wtQP2dDr).
- A migration US-009 está no diff contra main. Reverter apenas código não desfaz
  automaticamente uma promoção de esquema; o merge não é prova de deploy,
  aceite humano ou validação cloud.

A skill `pr` foi aplicada à descrição preparada. O executor automático de
`no-mistakes` não foi iniciado: exige histórico commitado e seu binário não
está no PATH. Foram executados diretamente os controles existentes, preservando
o trabalho local e a exigência de autorização expressa para publicação.
