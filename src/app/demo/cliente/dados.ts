import type { Chamado } from "../../../components/cliente/TabelaChamados";

export type ChamadoDetalhado = Chamado & {
  categoria: string;
  manutentor: string | null;
  bemPatrimonial: { codigo: string; descricao: string } | null;
  descricao: string;
  historico: readonly {
    data: string;
    titulo: string;
    autor: string;
    descricao: string;
  }[];
};

// Dados exclusivos da demonstração; substituir pela fonte real na integração.
export const chamadosCliente: readonly ChamadoDetalhado[] = [
  {
    id: 1042,
    assunto: "Projetor não liga",
    local: "Bloco B · Sala 12",
    solicitante: "Ana Souza",
    status: "Pendente",
    prioridade: "Não definida",
    data: "2026-11-08",
    categoria: "Audiovisual",
    manutentor: null,
    bemPatrimonial: { codigo: "PAT-0012", descricao: "Projetor Epson PowerLite" },
    descricao: "O projetor da sala não liga ao pressionar o botão de energia. A tomada foi verificada e está funcionando.",
    historico: [
      { data: "2026-11-08", titulo: "Chamado aberto", autor: "Ana Souza", descricao: "Solicitação registrada com status Pendente. Aguardando avaliação do Gestor." },
    ],
  },
  {
    id: 1041,
    assunto: "Computador lento",
    local: "Laboratório 03",
    solicitante: "Ana Souza",
    status: "Em atendimento",
    prioridade: "Média",
    data: "2026-11-05",
    categoria: "Informática",
    manutentor: "Carlos Oliveira",
    bemPatrimonial: { codigo: "PAT-0087", descricao: "Computador Dell OptiPlex" },
    descricao: "O computador apresenta lentidão ao iniciar e durante o uso dos programas do laboratório, prejudicando as atividades em aula.",
    historico: [
      { data: "2026-11-05", titulo: "Chamado aberto", autor: "Ana Souza", descricao: "Solicitação registrada com status Pendente." },
      { data: "2026-11-06", titulo: "Chamado aprovado", autor: "Mariana Lima · Gestora", descricao: "Prioridade Média definida e atendimento atribuído a Carlos Oliveira." },
      { data: "2026-11-07", titulo: "Atendimento iniciado", autor: "Carlos Oliveira · Manutentor", descricao: "Status alterado para Em atendimento. Diagnóstico do computador em andamento." },
    ],
  },
  {
    id: 1039,
    assunto: "Mouse com defeito",
    local: "Sala 15",
    solicitante: "Ana Souza",
    status: "Concluída",
    prioridade: "Baixa",
    data: "2026-10-29",
    categoria: "Informática",
    manutentor: "Carlos Oliveira",
    bemPatrimonial: null,
    descricao: "O mouse da sala apresenta falhas no clique e na movimentação do cursor.",
    historico: [
      { data: "2026-10-29", titulo: "Chamado aberto", autor: "Ana Souza", descricao: "Solicitação registrada com status Pendente." },
      { data: "2026-10-30", titulo: "Chamado aprovado", autor: "Mariana Lima · Gestora", descricao: "Prioridade Baixa definida e atendimento atribuído a Carlos Oliveira." },
      { data: "2026-10-30", titulo: "Atendimento iniciado", autor: "Carlos Oliveira · Manutentor", descricao: "Status alterado para Em atendimento. Verificação do periférico iniciada." },
      { data: "2026-10-31", titulo: "Chamado concluído", autor: "Carlos Oliveira · Manutentor", descricao: "Mouse substituído e funcionamento verificado. Status alterado para Concluída." },
    ],
  },
];

export const chamadosRecentes = chamadosCliente.slice(0, 3);

export const indicadores = [
  { titulo: "Total", valor: chamadosRecentes.length, icone: "▤" },
  { titulo: "Pendentes", valor: chamadosRecentes.filter((chamado) => chamado.status === "Pendente").length, icone: "◷" },
  { titulo: "Em atendimento", valor: chamadosRecentes.filter((chamado) => chamado.status === "Em atendimento").length, icone: "⚙" },
  { titulo: "Concluídos", valor: chamadosRecentes.filter((chamado) => chamado.status === "Concluída").length, icone: "✓" },
];
