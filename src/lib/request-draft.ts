export const camposSolicitacao = [
  ['local', 'Local', true], ['categoria_id', 'Categoria', true],
  ['assunto', 'Assunto', true], ['descricao', 'Descrição', true],
  ['motivo', 'Motivo', false], ['pessoas_areas_afetadas', 'Pessoas ou áreas afetadas', false],
  ['frequencia', 'Frequência', false], ['tipo_utilizacao', 'Tipo de utilização', false],
  ['riscos', 'Riscos', false], ['patrimonios_afetados', 'Patrimônios afetados', false],
] as const;
export type CampoSolicitacao = typeof camposSolicitacao[number][0];
export type Preenchimento = Record<CampoSolicitacao, string>;
export type ErrosPreenchimento = Partial<Record<CampoSolicitacao | 'solicitante_id', string>>;
export const preenchimentoInicial = Object.fromEntries(camposSolicitacao.map(([key]) => [key, ''])) as Preenchimento;
export function errosPreenchimento(values: Preenchimento): ErrosPreenchimento {
  return Object.fromEntries(camposSolicitacao.filter(([key, , required]) => required && !values[key].trim()).map(([key, label]) => [key, `Informe ${label.toLocaleLowerCase('pt-BR')}.`]));
}
