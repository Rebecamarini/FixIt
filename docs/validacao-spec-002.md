# Evidências da SPEC-002

Implementação: [PR #6](https://github.com/Rebecamarini/FixIt/pull/6), branch
`feat/spec-002-qualidade`, worktree `/home/joao_ricardo/FixIt-spec-002`.
Base: `49d4719494bb6698d0dada0a49ac31c537eaec56`, da US-001 ainda em PR #5.
Commits de implementação: `8cf234b845818037c0b0d902952f0f27697e7080` e
`2ded6e8c82cf5ac3ce0e6f1a73f209928d497072`.
A branch original e as alterações não commitadas do outro agente foram preservadas.

[Políticas, escopo, versões, fórmula e semântica](qualidade-estatica.md).
Tickets: [QL-001](https://trello.com/c/3HUKe2Ep),
[QL-002](https://trello.com/c/6Aj8JWhi),
[QL-003](https://trello.com/c/TYK9uKBh),
[QL-004](https://trello.com/c/UnhhQY6O),
[QL-005](https://trello.com/c/IAHKZQC0).

## Adoção e ensaios locais — 2026-10-22

`npm ci` instalou o lockfile com Node 24.18.0/npm 11.16.0. Os novos pacotes
são jscpd 5.4.2, dependency-cruiser 18.7.0 e Knip 6.42.1, todos exatos.
`npm run check:static`, `npm run typecheck`, `npm run build` e `npm test`
aprovaram. Também foram executados individualmente `tests/account.test.ts` e
`tests/connection.test.ts` durante a limpeza. Nenhuma integração destrutiva
foi executada na stack local compartilhada com o outro agente.

A primeira aplicação das regras ESLint encontrou sete violações: tamanho e
complexidade de `AccountForm` e complexidade de cadastro, login, configuração,
criação e listagem de solicitações. A limpeza separou validação de cadastro,
leitura de formulário, validação de URL/chave, campos de conta, validação de
solicitação/página e consulta de página vazia. Os tipos `Papel` e
`ResumoSolicitacao` perderam somente exports sem consumidor externo.
Duplicidade e ciclos não exigiram limpeza. A única exceção de adoção é o
binário de sistema `sg`, justificado junto à configuração Knip.

A observação foi a fronteira dos comandos, com amostras temporárias removidas
após cada ensaio. Não foi criada suíte que espelha configurações nem algoritmo
próprio de análise. A tabela registra saídas observadas, não inferidas de uma
leitura dos arquivos de configuração.

| Ensaio | Resultado observado |
| --- | --- |
| ESLint por stdin, `--stdin-filename src/ql-proof.ts --max-warnings=0`: funções de 49/50/51 linhas | Exit 0/0/1; diagnóstico `max-lines-per-function` em 51 |
| Complexidade clássica 9/10/11, usando 8/9/10 decisões `if` | Exit 0/0/1; diagnóstico `complexity` em 11 |
| Profundidade de blocos 3/4/5 | Exit 0/0/1; diagnóstico `max-depth` em 5 |
| Função de 50 linhas de código intercaladas com vazios e comentários | Exit 0 |
| Funções imediatamente invocadas de 50/51 linhas, `IIFEs: true` | Exit 0/1; antes da opção explícita, a de 51 passava |
| Teste com 55 decisões e mais de 50 linhas | Exit 0; nenhuma meta estrutural nova aplicada |
| Variável não usada num teste | Exit 1, `no-unused-vars`: lint anterior preservado |
| Supressão ESLint de uma única função, regra específica e motivo/ticket | Exit 0 |
| Fonte TS sintaticamente inválida | Exit 1, `Parsing error` |
| jscpd: cópias com 99/100/101 tokens em 11 linhas | Nenhum clone / um clone / um clone; exits 0/1/1 com duplicidade 50% nos dois últimos |
| jscpd: cópias de 110 tokens em 9/10/11 linhas físicas | Nenhum clone / um clone / um clone; exits 0/1/1; confirma `minLines: 9` para mínimo físico inclusivo de 10 |
| Duplicidade: 300 linhas duplicadas, denominadores 10001/10000/9999 | 2,999700029997% / 3% / 3,000300030003%; exits 0/0/1 |
| Bloco jscpd entre marcadores `ignore-start`/`ignore-end`, com justificativa temporária | Nenhum clone; exit 0 |
| Grafo permitido de dois módulos | Exit 0 |
| Ciclo de execução entre dois módulos | Exit 1, `no-runtime-cycles`, com caminho do ciclo |
| Mesmo ciclo usando alias de tsconfig | Exit 1, `no-runtime-cycles` |
| Ciclo somente de imports de tipos | Exit 0, arestas preservadas conforme política documentada |
| Import de arquivo inexistente | Exit 1, `no-unresolved-imports` |
| Módulo com 25 dependências | Exit 0, relatório nativo `Ce=25`; sem teto |
| Knip: novo arquivo abandonado | Exit 1, `Unused files`, com caminho |
| Novo export abandonado num módulo utilizado | Exit 1, `Unused exports`, com símbolo/localização |
| `picocolors` temporariamente declarado sem consumidor | Exit 1, `Unused devDependencies` |
| Mesmo pacote usado somente por teste / somente por script / somente por configuração ESLint | Exit 0 em cada um dos três casos; manifesto original restaurado |
| Entradas Next, proxy, metadados, ações e consumidores operacionais existentes | Knip exit 0 |
| Função longa, ciclo e arquivo sem uso em `src/__generated__`, e repetição somente em teste | Os quatro comandos exit 0; temporários removidos |

As cópias para os limites de tokens usaram expressões identificadoras distintas,
com 50 pares `identificador;` formando exatamente 100 tokens, distribuídos em
11 linhas; não reimplementaram o tokenizer. O ensaio percentual usou duas
cópias de 300 linhas (`clone_0;` a `clone_299;`) e um terceiro arquivo de
identificadores diferentes para completar cada denominador. O detector nativo
contou 300 linhas duplicadas, não 600; essa é a semântica documentada de D.
Nos ensaios locais de duplicidade foi usado reporter JSON temporário; no
ensaio percentual, ele permitiu ler os valores sem arredondamento do console.
O CI usa os logs nativos e não exige artefato.

## Execução remota válida — 2026-10-22

[Run 39871285081](https://github.com/Rebecamarini/FixIt/actions/runs/39871285081),
SHA `2ded6e8c82cf5ac3ce0e6f1a73f209928d497072`, evento `pull_request` do PR #6.
[Job CI e logs](https://github.com/Rebecamarini/FixIt/actions/runs/39871285081/job/120146061669),
23:21:58–23:25:55 UTC: **success**.

- Instalação pelo lockfile aprovada. O passo estático começou às 23:22:28 UTC,
  antes da stack e sem arquivo de conexão ou secrets cloud.
- ESLint aprovado; jscpd: zero clones/0%; grafo: zero violações, 25 módulos e
  48 dependências (incluindo terminais externos), tabela nativa de contagens;
  Knip: zero achados. Não houve exclusão por diff.
- Stack completa descartável, reset sem seed e configuração local passaram.
  `npm run verify` passou lint, tipos, build, **6 unitários e 28 integrações**,
  com zero falhas e zero skips; cleanup passou.
- As integrações exercitaram cadastro, login/logout, campos inválidos, Auth
  real, cookies, perfil, recusa de elevação de papel, RLS, trim e tipos JSON,
  criação/paginação/detalhe/histórico de solicitações, rollback transacional,
  autorização, isolamento e preparação repetida idempotente.
- [Promote pending migrations](https://github.com/Rebecamarini/FixIt/actions/runs/39871285081/job/120147501870)
  ficou **skipped**, pois o evento era PR.

A execução anterior
[39871151643](https://github.com/Rebecamarini/FixIt/actions/runs/39871151643),
SHA `8cf234b845818037c0b0d902952f0f27697e7080`, também passou, mas não inclui a
opção explícita para IIFEs; a comprovação da implementação completa usa o SHA
`2ded6e8` acima. QL-001 a QL-004 receberam evidências e foram concluídos no
Trello antes de iniciar QL-005 em 2026-10-24.

## Falha controlada remota — 2026-10-24

Depois de concluir e conferir os quatro predecessores no Trello, foi aberto o
[PR temporário #7](https://github.com/Rebecamarini/FixIt/pull/7), contra a
branch da SPEC-002, no SHA `0bc88b3a9021cc495ad31ce5483155da089069d4`.
A única mudança era `src/ql005-analysis-failure.ts`, com uma declaração de
função sintaticamente incompleta. O workflow e suas condições não foram alterados.

[Run 40116104523](https://github.com/Rebecamarini/FixIt/actions/runs/40116104523),
[CI/logs 120937589333](https://github.com/Rebecamarini/FixIt/actions/runs/40116104523/job/120937589333),
17:26:15–17:26:47 UTC: **failure**.

A instalação passou. O passo `npm run check:static` começou às
17:26:41 UTC; às 17:26:44 UTC o ESLint informou:

```text
src/ql005-analysis-failure.ts
  3:0  error  Parsing error: '}' expected
Process completed with exit code 1.
```

O log completo passa dessa falha diretamente ao cleanup automático de Git.
Não executou os comandos seguintes de duplicidade/grafo/Knip, início/reset
da stack, configuração de conexão, build ou testes, nem a parada de uma stack
que não chegou a iniciar. O endpoint de jobs devolveu `steps: []` nessa
consulta; a comprovação da interrupção usa a sequência do log completo,
a falha do job e as condições do workflow, sem inventar status individuais
que a API não forneceu.

O [job de promoção 120937714247](https://github.com/Rebecamarini/FixIt/actions/runs/40116104523/job/120937714247)
ficou **skipped**. Em PR, essa condição também decorre do evento, portanto o
ensaio comprova a interrupção antecipada do CI, enquanto o gate de promoção
em push permanece conferido estaticamente por `needs: ci`.

O PR #7 foi fechado sem merge e sua branch remota de validação removida após
capturar as evidências. A amostra inválida não entrou na branch da SPEC-002,
na US-001 ou em `main`. A implementação válida permanece em `2ded6e8`.

## Revisão

A skill `code-review` examinou `49d4719...8cf234b` nos eixos Standards e Spec,
por revisores independentes: zero achados em ambos. O delta `8cf234b...2ded6e8`
também foi revisado nos dois eixos: zero achados. A revisão automatizada não
representa aprovação humana do PR.

## Limites da comprovação

A configuração `on: pull_request` e `push.branches: [main]`, sem filtros de
caminhos, preserva a execução das análises nos dois eventos. Os jobs mantêm
checkout de `github.sha`; promoção mantém `needs: ci` e a condição exclusiva
de push/main. Não houve mudança de migrations ou das etapas da promoção.

Os ensaios desta entrega usam PRs: não foi criado push inválido em `main`,
nem exercitada uma nova promoção cloud. Skip de promoção em PR também ocorre
pela condição de evento; não equivale a observar uma promoção elegível ser
bloqueada por falha do CI. A dependência do mesmo CI e SHA foi conferida na
configuração. Não foi configurada nem alegada proteção de branch.

PR #6 é empilhado sobre a US-001 do PR #5 e permanece separado da branch do
outro agente. Aprovação de CI nesta entrega não significa merge em `main`.
