import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

// Renderiza o componente real com React DOM. O processo separado usa a condição
// padrão do React; a suíte principal usa react-server para os módulos de dados.
function renderizarDetalhe() {
  return execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { registerHooks } from "node:module";
    import { readFileSync } from "node:fs";
    import ts from "typescript";
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    registerHooks({ resolve(specifier, context, nextResolve) {
      return nextResolve(specifier === "next/link" ? "next/link.js" : specifier, context);
    }, load(url, context, nextLoad) {
      if (url.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, {get: (_, key) => key});", shortCircuit: true };
      if (url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText };
      return nextLoad(url, context);
    }});
    const { DetalhesSolicitacao } = await import("./src/app/solicitacoes/[id]/detalhes.tsx");
    const solicitacao = { id: "pedido-proprio", autor_id: "cliente", categoria_id: "categoria", assunto: "Lâmpada apagada", local: "Sala 12", descricao: "<script>alert(1)</script>", motivo: null, pessoas_areas_afetadas: "Turma A", frequencia: "Diária", tipo_utilizacao: "Aulas", riscos: "Escuridão", patrimonios_afetados: "Luminária", criado_em: "2026-10-29T12:00:00Z", estado: "Pendente" };
    const historico = [
      { id: "primeiro", autor: "Ana Cliente", criado_em: "2026-10-29T12:00:00Z", descricao: "Solicitação criada." },
      { id: "segundo", autor: "Ana Cliente", criado_em: "2026-10-29T13:00:00Z", descricao: "Segundo evento." }
    ];
    process.stdout.write(JSON.stringify({
      preenchido: renderToStaticMarkup(createElement(DetalhesSolicitacao, { detalhe: { solicitacao, categoria: "Elétrica", historico } })),
      vazio: renderToStaticMarkup(createElement(DetalhesSolicitacao, { detalhe: { solicitacao, categoria: "Elétrica", historico: [] } }))
    }));
  `], { encoding: "utf8" });
}

test("detalhe mostra dados próprios, categoria e histórico com autor/data, sem controles de escrita", () => {
  const { preenchido, vazio } = JSON.parse(renderizarDetalhe());
  for (const texto of ["Lâmpada apagada", "Sala 12", "Elétrica", "Pendente", "Não informado", "Turma A", "Diária", "Aulas", "Escuridão", "Luminária", "Ana Cliente", "29/10/2026", "09:00"]) assert.ok(preenchido.includes(texto), texto);
  assert.ok(preenchido.indexOf("Solicitação criada.") < preenchido.indexOf("Segundo evento."));
  assert.match(preenchido, /href="\/solicitacoes"/);
  assert.match(preenchido, /Registro somente leitura/);
  assert.doesNotMatch(preenchido, /<form|<input|<textarea|<button|<script/);
  assert.match(preenchido, /&lt;script&gt;/);
  assert.match(vazio, /Nenhum evento registrado/);
});

test("consulta sinaliza anexos e dados de atendimento indisponíveis sem inventar registros", () => {
  const { preenchido } = JSON.parse(renderizarDetalhe());
  for (const secao of ["Anexos", "Responsáveis", "Observações"]) assert.ok(preenchido.includes(secao));
  assert.match(preenchido, /A consulta de anexos ainda não está disponível/);
  assert.match(preenchido, /A consulta de responsáveis ainda não está disponível/);
  assert.match(preenchido, /A consulta de observações de atendimento ainda não está disponível/);
});
