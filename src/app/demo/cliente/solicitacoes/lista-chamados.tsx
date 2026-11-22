"use client";

import { useState } from "react";
import TabelaChamados, { type Chamado } from "../../../../components/cliente/TabelaChamados";
import styles from "./page.module.css";

const statusDisponiveis: readonly Chamado["status"][] = [
  "Pendente", "Aprovada", "Em atendimento", "Concluída", "Descartada",
];

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export default function ListaChamados({ chamados }: { chamados: readonly Chamado[] }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const termo = normalizar(busca);
  const filtrados = chamados.filter((chamado) => (
    (!status || chamado.status === status)
    && [`#${chamado.id}`, chamado.assunto, chamado.local].some((valor) => normalizar(valor).includes(termo))
  ));

  return (
    <TabelaChamados chamados={filtrados} variante="todos" demonstracao>
      <div className={styles.filtros}>
        <div className={styles.busca}>
          <label htmlFor="busca-chamados">Pesquisar chamados</label>
          <input id="busca-chamados" type="search" placeholder="Buscar por ID, assunto ou localização..." value={busca} onChange={(event) => setBusca(event.target.value)} />
        </div>
        <div className={styles.status}>
          <label htmlFor="status-chamados">Status</label>
          <select id="status-chamados" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            {statusDisponiveis.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
          </select>
        </div>
      </div>
      <p className={styles.resultados} role="status" aria-live="polite" aria-atomic="true">
        {filtrados.length} {filtrados.length === 1 ? "chamado encontrado" : "chamados encontrados"}
      </p>
    </TabelaChamados>
  );
}
