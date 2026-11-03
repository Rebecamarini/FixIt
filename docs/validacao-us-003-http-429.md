# US-003 — Validação da orientação de aguardar na consulta do perfil

[Cartão](https://trello.com/c/e6Ukr9iC) · [Spec](specs/us-003-consulta-perfil-http-429.md)

Implementação e validação local em 2026-10-31, relatório consolidado em
2026-11-01, na branch `fix/us-003-perfil-http-429`, baseada em
`8cdf78341644be0436e4c2ebdf54a0655cb8eaeb`. Sem commits, push ou PR.

## Comportamento

A consulta mantém HTTP 429 como erro específico. A página e as ações usam
somente a mensagem sanitizada de aguardar; outros erros preservam seus avisos
anteriores. A consulta inicial sob 429 impede gravação e não encerra a sessão.
Se a senha já mudou, o encerramento permanece pendente e pode ser repetido
manualmente, preservando a sessão atual.

## Verificações

- TDD: regressões de consulta, três salvamentos e encerramento com SDK real e
  resposta HTTP controlada falharam antes da correção e passaram depois.
- `npm test`: 13 testes aprovados, sem falhas ou skips.
- `npm run typecheck` e `npm run build`: aprovados na primeira integração local.
- `npm run test:integration`: 41 testes aprovados, sem falhas ou skips, com Auth,
  PostgreSQL e Data API reais em stack local recém-criada com todas as migrations.
  Inclui US-003/004 e troca real de senha seguida por 429 na consulta, confirmação
  da nova credencial, sessão atual renovável e repetição isolada do encerramento.
- `npm run lint`: bloqueado por **22 erros preexistentes**, também reproduzidos
  na árvore anterior à aplicação do patch. São as mesmas funções e métricas;
  apenas números de linha mudaram. Nenhuma regra foi desabilitada. Esse bloqueio
  impede declarar cumprido o critério de lint aprovado.

## Ambiente e limites

Node 24.18.0, npm 11.16.0 e CLI Supabase 2.121.0. A máquina não tinha runtime
Docker: foram instalados Colima/Docker e criada a VM dedicada `fixit-validation`,
sem ativá-la como contexto Docker padrão. A configuração privada `.env.local`
aponta somente para o Supabase local. Nenhuma alteração cloud foi executada.
Ao finalizar, o servidor Next.js e a stack Supabase foram encerrados; a VM
dedicada também foi parada. Colima/Docker e os dados locais foram preservados.

A primeira execução completa de integração teve 40 aprovações e uma falha
porque um teste existente chama `sg docker -c` diretamente, utilitário Linux
ausente no macOS. A execução aprovada usou um adaptador temporário externo ao
repositório, que executa o mesmo comando Docker sem troca de grupo. O teste
real de rollback e todos os demais passaram; o código da suíte foi preservado.

As guias instaladas do Next.js sobre erros e atualização de cookies foram
consultadas, assim como o changelog e a documentação oficial de
[getUser](https://supabase.com/docs/reference/javascript/auth-getuser) e
[erros do Auth](https://supabase.com/docs/guides/auth/debugging/error-codes).

O perfil atual edita somente nome após US-004. Esta correção não afirma aceite
dos critérios históricos de matrícula/setor nem resolve a ausência do ADR 0005
citada na reconciliação do board.

## Interface e revisão

O navegador identificou que a renderização após atualização de cookies podia
substituir o formulário por erro de consulta, perdendo o aviso parcial. O novo
painel mantém o formulário montado durante esse erro transitório e preserva os
dados já presentes somente na memória do cliente. A autenticação das ações
continua obrigatória; sessão efetivamente perdida continua redirecionando ao
login. A confirmação de senha alterada também permanece nas novas tentativas
de encerramento, inclusive se ocorrer outro erro ou se a tentativa funcionar.

Conferência em Chromium contra build de produção local: Cliente, Manutentor e
Gestor, nas larguras 390 e 1440 px. Todos os sete cenários passaram em cada
combinação: abertura, salvar nome, e-mail, senha antes de gravar, resultado
parcial após troca real, repetição ainda limitada e repetição bem-sucedida.
Foram verificadas preservação de nome/e-mail, limpeza de senhas, permanência do
modal, orientação sanitizada e ausência de redirecionamento por 429 isolado.
Nenhum erro JavaScript foi registrado; não houve transbordamento horizontal.

As falhas foram controladas somente na fronteira HTTP do processo local, por
instrumentação temporária externa ao repositório. Não foi acrescentado failpoint
ao produto nem suíte permanente de navegador. Evidências: [resultados dos 42
cenários](evidencias/us-003-http-429/resultados.json), [modal de e-mail no
computador](evidencias/us-003-http-429/Cliente-1440-email.png) e [encerramento
pendente no celular](evidencias/us-003-http-429/Gestor-390-parcial.png).

Revisão por subagentes: Standards, zero achados introduzidos; Spec, zero
achados no diff final após corrigir o P2 de perda da confirmação da troca de
senha durante repetição. Typecheck, build e diff check foram repetidos após o
ajuste de interface e passaram. O lint final conserva os mesmos 22 erros do
baseline, sem novos achados ou aumento das métricas apontadas.

O cartão segue para Code Review, sem conclusão/aceite completo por causa do
lint preexistente e sem alegar integração/publicação das alterações locais.

## Revalidação prática solicitada — 2026-11-01

Stack local reiniciada e build de produção exercitado novamente no Chromium.
Foram aprovados **60 cenários de interface**: os sete anteriores mais salvar
nome com sucesso, alterar e-mail com sucesso e recarregar conferindo ambos os
valores persistidos, nos três papéis e nas duas larguras. O login da segunda
largura utiliza o e-mail e a senha efetivamente alterados na primeira.
O [resultado estruturado](evidencias/us-003-http-429/resultados.json) e as
18 imagens foram atualizados. Nenhum erro JavaScript foi registrado.

Também foram repetidos os **8 testes de integração de perfil**, todos aprovados
sem falhas ou skips: leitura/edição própria, isolamento, troca real de e-mail,
validação e troca real de senha, preservação/revogação das sessões, recuperação
do resultado parcial, concorrência de e-mail e mensagens sanitizadas.

Auth e banco foram reais nos caminhos de sucesso. O HTTP 429 foi induzido
somente na fronteira HTTP local para exercitar o comportamento de excesso de
tentativas, sem consumir deliberadamente limites do serviço cloud. Nenhuma
alteração adicional no código do produto foi necessária nesta revalidação.
