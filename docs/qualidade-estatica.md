# Metas estáticas — SPEC-002

[SPEC-002](https://trello.com/c/kOqyQub4):
[QL-001](https://trello.com/c/3HUKe2Ep),
[QL-002](https://trello.com/c/6Aj8JWhi),
[QL-003](https://trello.com/c/TYK9uKBh),
[QL-004](https://trello.com/c/UnhhQY6O),
[QL-005](https://trello.com/c/IAHKZQC0).

## Execução

O job CI de `.github/workflows/verify-and-promote.yml` executa
`npm run check:static` imediatamente após `npm ci`, antes de iniciar a stack,
configurar conexão, gerar tipos, fazer build ou executar testes. Roda em todo
PR e push de `main`, sobre toda a aplicação, sem filtros por diff, banco,
secrets cloud, contas de análise ou envio de código a serviços de análise.
Os comandos encadeados por `&&` preservam diagnósticos e códigos de saída;
um erro interrompe a sequência. O cleanup só tenta parar a stack se seu passo
chegou a executar. Não há baseline, tolerância inicial, cache de análise,
`continue-on-error`, hooks, painel ou relatório obrigatório.

| Comando | Ferramenta fixada | Política |
| --- | --- | --- |
| `npm run lint` | ESLint 9.39.1 existente | Complexidade clássica ≤10, profundidade ≤4, função ≤50 linhas |
| `npm run check:duplicates` | jscpd 5.4.2, binário Rust gratuito | Duplicidade ≤3%; blocos ≥100 tokens e ≥10 linhas inclusivas |
| `npm run check:dependencies` | dependency-cruiser 18.7.0 | Zero ciclos de execução e imports não resolvidos; contagens informativas |
| `npm run check:unused` | Knip 6.42.1 | Zero arquivos, exports, tipos ou pacotes sem consumidores legítimos |

Node 24.18.0 e npm 11.16.0 continuam fixados. Os três novos pacotes são
`devDependencies` exatas, instaladas pelo `package-lock.json`; não instalar
CLIs globais. O jscpd usa os pacotes opcionais de binários por plataforma do
lockfile; Linux x64 glibc atende ao runner Ubuntu 24.04. Não usar os modos
semântico/HTTP do jscpd: a execução configurada é detecção local de tokens.
Os comandos locais são opcionais; a exigência operacional é o CI.

`npm run verify` mantém lint, tipos, build, testes unitários e todas as
integrações existentes. A promoção mantém `needs: ci`, o checkout do mesmo
`github.sha` e a condição de push para `main`. Skip de deploy em PR também
resulta dessa condição de evento; não comprova execução do gate em push.
Esta mudança não configura proteção de branch nem publica o aplicativo.

## Escopo

As novas metas estruturais cobrem `src/`, inclusive componentes, Server Actions,
proxy e módulos do servidor. ESLint aplica as três regras a JS/JSX/TS/TSX e
variantes de módulo; o jscpd também mede CSS suportado sob `src/`. O grafo parte
de todos os módulos em `src/`. Não há exclusão de funções ou áreas problemáticas.

Declarações `*.d.ts`, `*.d.mts`, `*.d.cts` e diretórios reservados a geração
`generated`/`__generated__` ficam fora dessas métricas. Não colocar código manual
nesses diretórios. Dependências, `.next`, `out`, temporários, documentos,
migrations e scripts operacionais ficam fora do escopo estrutural por estarem
fora de `src/`. Testes preservam lint, tipos e execução anteriores; não recebem
limites de complexidade, tamanho ou repetição.

O Knip usa escopo mais amplo: testes, scripts, configurações e seus imports
contam como consumidores reais de pacotes e exports. A configuração acrescenta
as entradas `tests/*.test.ts`, `tests/*.integration.ts` e `scripts/*.ts` às
entradas dos plugins; não transforma toda a aplicação em entrada. Helpers de
testes continuam alcançados pelos testes. Não usar só `--production`, que
ignoraria consumidores e dependências de desenvolvimento.

## Semântica e fundamentos

### Funções

Regras nativas `complexity` com `variant: classic`, `max-depth` e
`max-lines-per-function`, todas com severidade `error`, por função. Igualdade
aprova; médias não compensam violações. Complexidade conta decisões, incluindo
operadores lógicos, condicionais, parâmetros padrão e optional chaining conforme
a versão do ESLint. Profundidade segue blocos do AST, não indentação ou árvore
JSX. O tamanho conta da assinatura ao fechamento, inclusive ambos, linhas JSX
e corpos de callbacks dentro da função externa. Ignora somente linhas vazias e
linhas inteiramente de comentário. Uma linha com código e comentário conta.
`IIFEs: true` inclui funções imediatamente invocadas, ignoradas pelo default
da regra; elas também precisam atender ao limite individual.

Complexidade 10 é política do FixIt, fundamentada no
[NIST SP 500-235, seção 2.5](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication500-235.pdf),
que admite avaliação e exceções, não uma lei universal. ESLint usa 20 como
padrão de [complexidade](https://eslint.org/docs/latest/rules/complexity);
[profundidade 4](https://eslint.org/docs/latest/rules/max-depth) e
[50 linhas](https://eslint.org/docs/latest/rules/max-lines-per-function)
acompanham seus defaults, com exclusão explícita de vazios/comentários.
Refatorar responsabilidades concretas; não compactar linhas para aprovar.

### Duplicidade

O jscpd 5.4.2 usa `mode: mild`: remove whitespace e quebras de linha da
comparação de tokens; preserva comentários, nomes, literais e maiúsculas.
Não ativamos normalização de identificadores/literais, similaridade ou IA.
A detecção agrupa formatos; TSX é reconhecido pelo tokenizer nativo.

**Atenção ao mínimo inclusivo de linhas:** nessa versão, o filtro de clone usa
`end.line - start.line`, embora o relatório conte as duas extremidades.
Por isso `.jscpd.json` usa **`minLines: 9` para detectar 10 linhas físicas**;
`minTokens: 100` é inclusivo diretamente. Com `minLines: 10`, um clone de
exatamente 10 linhas seria indevidamente aceito. Ensaios com 9, 10 e 11 linhas
e 99, 100 e 101 tokens comprovaram essa tradução. Não alterar para 10 sem
revalidar a semântica da versão. Ver
[filtro nativo](https://github.com/kucherenko/jscpd/blob/v5.4.2/rust/crates/cpd-core/src/detect.rs).

O percentual efetivo é `100 × D / L`, comparado como ponto flutuante com 3,
sem arredondar para a decisão. A tabela de console arredonda para duas casas:
é possível exibir 3.00% e reprovar por 3.0003%.

- `D`: soma das linhas correspondentes do fragmento primário de cada clone,
  incluindo início e fim. Não é união de todas as linhas das duas cópias;
  clones sobrepostos podem contribuir mais de uma vez.
- `L`: soma de `line_count()` das fontes que o detector admite. Em arquivos
  comuns é a última linha contendo token, incluindo espaços/comentários
  anteriores e excluindo vazios finais. Blocos incorporados usam as linhas
  próprias do formato. O scanner descarta arquivos com menos de 9 linhas
  físicas e, para formatos comuns, menos de 100 tokens; eles não conseguem
  formar um clone válido e não diluem o denominador. Isso é normalização
  nativa, não exclusão manual de arquivos da aplicação.

Fontes:
[estatísticas](https://github.com/kucherenko/jscpd/blob/v5.4.2/rust/crates/cpd-finder/src/statistics.rs),
[contagens](https://github.com/kucherenko/jscpd/blob/v5.4.2/rust/crates/cpd-core/src/models.rs),
[admissão de fontes](https://github.com/kucherenko/jscpd/blob/v5.4.2/rust/crates/cpd-finder/src/orchestrate.rs).
O comando percorre todo `src/`, sem depender de linhas novas ou alteradas.
Os 3% adaptam a referência
[Sonar sobre código novo](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates)
a toda a aplicação. Os mínimos vêm da
[referência de métricas Sonar](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition).
Não há equivalência numérica entre detectores nem garantia de qualidade total.

### Dependências

`tsPreCompilationDeps: specify` conserva e identifica imports somente de tipos;
eles aparecem no grafo e na contagem. A regra reprova ciclos formados inteiramente
por dependências de execução; ciclos com aresta `type-only` são permitidos,
pois não constituem um ciclo de execução. Server Actions são imports legítimos,
sem regra nova de fronteira cliente/servidor. Aliases vêm de `tsconfig.json`;
o grafo considera imports estáticos e imports dinâmicos com destino literal
reconhecidos pelo analisador. Não infere destinos determinados em execução,
relações SQL ou convenções de execução não representadas por imports.

Partindo de todo `src/`, resolve referências externas e as mostra como terminais,
sem seguir seu código. Imports não resolvidos reprovam, evitando um grafo
incompleto silencioso. O relatório nativo `metrics` informa `Ce` (dependências
saindo), `Ca` (entrando), `N` e instabilidade, sem teto. `Ce` inclui dependências
externas, CSS e tipos distintos resolvidos, não quantidade de símbolos
importados. O primeiro comando usa `err` e precisa passar antes do relatório
informativo. Consulte a
[documentação nativa](https://github.com/sverweij/dependency-cruiser/blob/v18.7.0/doc/options-reference.md).

### Uso real e exceções

O plugin Next.js do Knip reconhece páginas, layouts, metadados, handlers, proxy
e seus exports convencionais. Não remover entradas do framework para silenciar
achados; conferir o consumidor antes de apagar código. Os contratos de
solicitações têm consumidores nos testes e na preparação operacional e foram
preservados. Os tipos `Papel` e `ResumoSolicitacao` perderam apenas o `export`,
pois já são usados internamente nos tipos públicos.

A única exceção de adoção é `ignoreBinaries: ["sg"]` em `knip.jsonc`: trata-se
do util-linux instalado no sistema, usado por testes para entrar no grupo Docker,
não de pacote npm ausente. ESLint e Knip reconhecem os demais consumidores de
configuração e CLI. Nenhum pacote da aplicação precisou ser removido.

Exceções futuras precisam do ticket, localização exata e motivo junto à
supressão: `eslint-disable-next-line` da regra específica; marcadores
`jscpd:ignore-start`/`jscpd:ignore-end` no bloco; supressão específica do Knip somente após confirmar o consumidor; exceção de
aresta específica no grafo quando justificável. Não ampliar limites, ignorar
uma pasta manual inteira, silenciar falhas ou criar baseline. O suporte a uma
supressão não dispensa sua justificativa e revisão.
