import assert from "node:assert/strict";
import { test } from "node:test";
import { filtrarSolicitacoes } from "../src/lib/client-requests.ts";
import type { ResumoSolicitacao } from "../src/server/requests.ts";

const itens: ResumoSolicitacao[] = Array.from({ length: 21 }, (_, indice) => ({
  id: `pedido-${indice}`, assunto: indice === 20 ? "Lâmpada apagada" : "Projetor",
  categoria_id: "categoria", categoria: { nome: "Elétrica" }, criado_em: "2026-11-01T12:00:00Z", estado: "Pendente",
}));

test("busca encontra solicitação além da primeira página e ignora acentos e caixa", () => {
  assert.deepEqual(filtrarSolicitacoes(itens, " LAMPADA ", ""), [itens[20]]);
  assert.deepEqual(filtrarSolicitacoes(itens, "pedido-20", "Pendente"), [itens[20]]);
  assert.equal(filtrarSolicitacoes(itens, "eletrica", "").length, 21);
});

test("filtros combinam busca e estado, preservam ordenação e suportam resultados vazios", () => {
  assert.deepEqual(filtrarSolicitacoes(itens, "", "Concluída"), []);
  assert.deepEqual(filtrarSolicitacoes(itens, "inexistente", ""), []);
  assert.deepEqual(filtrarSolicitacoes([], "", ""), []);
  assert.deepEqual(filtrarSolicitacoes(itens, "", "Pendente"), itens);
});

test("busca por localização considera detalhes de solicitações além da primeira página", () => {
  const locais = new Map([[itens[20].id, "Bloco B · Sala Técnica"]]);
  assert.deepEqual(filtrarSolicitacoes(itens, "tecnica", "Pendente", locais), [itens[20]]);
});
