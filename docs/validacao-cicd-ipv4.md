# Correção da promoção por IPv4

[Spec e acompanhamento](https://trello.com/c/wtQP2dDr) ·
[BT-006](https://trello.com/c/3W4Ajz0j) · [Operação](ci-cd.md).

## Validação local anterior à publicação — 2026-11-03

Implementação na branch `integration/cicd-ipv4`, baseada na main
`fee4699eb85ef1f9eb585bf9e3b2eb23e0fca0d1`, sem commit, push, PR ou escrita
cloud durante esta validação. Publicação e CI posteriores são acompanhados
no cartão da correção, com SHA e links das execuções.
O workflow agora cria o vínculo no próprio runner pelo pooler padrão,
consulta o histórico, faz dry-run e promove pelo vínculo, consultando o
histórico novamente. Destino fixo, secrets, CI do mesmo SHA, evento push/main,
serialização e flags de preservação continuam mantidos.

A fronteira de teste foi confirmada pelo usuário: workflow real elegível e
comparação não destrutiva dos dados antes/depois. O estado RED está na
[execução da regressão](https://github.com/Rebecamarini/FixIt/actions/runs/41736489890):
CI aprovado, promoção reprovada na conexão. GREEN cloud ainda não foi
executado; verificações locais não o substituem. Não foi criado teste que
apenas espelhe a configuração do YAML.

## Verificações locais

- CLI instalada: 2.121.0; consultados `link --help`, `db push --help` e
  `migration list --help`, sem conexão remota.
- `actionlint` 1.7.12: workflow aprovado; binário oficial fora do repositório,
  checksum conferido. `shellcheck` não estava disponível.
- YAML lido com Ruby/Psych; shell do passo de promoção extraído para arquivo
  temporário e aprovado por `bash -n`.
- Shell do passo executado apenas com secrets ausentes e, separadamente,
  credenciais fictícias/destino incorreto: ambos recusados antes de chamar a CLI.
- `npm test`, Node 24.18.0: 13 testes unitários aprovados, zero falhas/skips.
- `git diff --check`: aprovado.

Não houve alteração de código da aplicação ou migrations. CI completo,
integrações locais descartáveis e CI/CD remoto desta correção continuam sem
nova execução. Docker não estava acessível no socket padrão nesta rodada.

## Prova operacional pendente

1. Antes da integração/publicação autorizada, confirmar projeto saudável,
   revisar o impacto das migrations do SHA a promover e capturar um baseline
   privado dos registros existentes. Suspender escritas concorrentes durante
   a comparação ou identificar separadamente as alterações legítimas do período.
   Guardar IDs, vínculos e valores de contas/perfis, solicitações, histórico e
   cadastros em local restrito; nunca anexar dados pessoais, senhas ou tokens
   aos logs/cartão. Registrar só contagens, hashes e resultados redigidos.
2. Acompanhar o push/main contendo a correção: registrar URL, tentativa, SHA,
   horários e jobs. CI e promoção precisam aprovar o mesmo SHA. Conferir que
   a conexão escolhida é o pooler IPv4 de sessão; sucesso isolado do vínculo
   não basta. Conferir histórico anterior, dry-run e histórico posterior do job.
3. Comparar somente as pendências previstas para esse SHA. A referência
   histórica é cinco migrations no cloud e oito no código, com possíveis
   pendências `20261024194318`, `20261025175916` e `20261028205115`; recalcular
   a diferença ao executar. Falha/divergência exige investigação, sem reset,
   reparo manual de histórico ou aplicação forçada.
4. Comparar os registros anteriores pela mesma projeção de campos, em ordem
   estável. As migrations atuais acrescentam campos em perfis e solicitações;
   US-004 relaxa a obrigatoriedade de matrícula/setor pessoal e US-009 preenche
   `solicitante_id` das solicitações legadas com `autor_id`. Conferir IDs e
   valores originais, os novos campos e vínculos esperados; não exigir hash
   bruto idêntico de linhas com novas colunas. Explicar qualquer diferença e
   comprovar conservação de contas, solicitações e eventos preexistentes.
5. Repetir um fluxo elegível após o sucesso, preservando evento/ref/SHA e
   verificando que nenhum SHA posterior já foi promovido. A CLI deve informar
   ausência de pendências, sem duplicação ou reaplicação. Não criar push
   artificial nem executar deploy manual para obter essa evidência.
6. Atualizar e reler BT-006, o cartão da correção e os dependentes afetados.
   Remover o bloqueio cloud só depois da prova; o cartão de reativação só pode
   encerrar seu critério de dados se a evidência realmente o cobrir. O baseline
   da próxima promoção não comprova preservação do período anterior a ele.

Até essa prova, CA-01 a CA-06 da spec continuam pendentes. A revisão local de
gates é apoio parcial de CA-05, não comprovação de promoção nem de sigilo em
uma execução futura.

Referências consultadas: [CLI link](https://supabase.com/docs/reference/cli/supabase-link),
[conexões IPv4](https://supabase.com/docs/guides/database/connecting-to-postgres)
e [changelog](https://supabase.com/changelog). Nenhuma atualização de versão,
plano ou projeto foi necessária para preparar esta correção.
