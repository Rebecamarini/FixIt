import assert from "node:assert/strict";
import { test } from "node:test";
import { criarPaginacao, interpretarPagina, obterEstadoListagem } from "../src/app/solicitacoes/listagem.ts";

test("paginação da listagem interpreta a URL e limita os controles ao conjunto disponível", () => {
  assert.equal(interpretarPagina(undefined), 1);
  assert.equal(interpretarPagina("2"), 2);
  for (const valor of ["", "0", "-1", "1.5", "texto", ["1", "2"]]) {
    assert.equal(interpretarPagina(valor), 1);
  }

  assert.deepEqual(criarPaginacao(1, 45), { totalPaginas: 3, anterior: null, proxima: 2 });
  assert.deepEqual(criarPaginacao(2, 45), { totalPaginas: 3, anterior: 1, proxima: 3 });
  assert.deepEqual(criarPaginacao(3, 45), { totalPaginas: 3, anterior: 2, proxima: null });
});

test("estado vazio representa somente Cliente sem solicitações próprias", () => {
  assert.equal(obterEstadoListagem(0, 0), "vazio");
  assert.equal(obterEstadoListagem(21, 0), "pagina-vazia");
  assert.equal(obterEstadoListagem(21, 20), "com-itens");
});
