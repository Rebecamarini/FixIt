export const camposBem = [
  ['descricao', 'Descrição', true, 500],
  ['localizacao', 'Localização', true, 200],
  ['estado_conservacao', 'Estado de conservação', true],
  ['marca', 'Marca', false, 100],
  ['modelo', 'Modelo', false, 100],
  ['data_aquisicao', 'Data de aquisição', false],
  ['garantia_ate', 'Garantia até', false],
] as const;
export const estadosConservacao = ['Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo'] as const;
export type PreenchimentoBem = Record<typeof camposBem[number][0], string>;
export type ErrosBem = Partial<Record<keyof PreenchimentoBem, string>>;
export const preenchimentoBemInicial: PreenchimentoBem = {
  descricao: '', localizacao: '', estado_conservacao: '', marca: '', modelo: '', data_aquisicao: '', garantia_ate: '',
};

export function hojeBem() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function dataValida(value: string) {
  const date = new Date(value + 'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '0001-01-01'
    && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function errosTextos(values: PreenchimentoBem): ErrosBem {
  const errors: ErrosBem = {};
  for (const [key, label, required, ...rest] of camposBem) {
    const value = values[key].trim();
    if (required && !value) errors[key] = `Informe ${label.toLowerCase()}.`;
    if (rest[0] && [...value].length > rest[0]) errors[key] = `Use até ${rest[0]} caracteres.`;
  }
  if (values.estado_conservacao.trim() && !estadosConservacao.some(state => state === values.estado_conservacao.trim())) {
    errors.estado_conservacao = 'Selecione um estado de conservação válido.';
  }
  return errors;
}

function errosDatas(values: PreenchimentoBem, hoje: string): ErrosBem {
  const errors: ErrosBem = {};
  for (const field of ['data_aquisicao', 'garantia_ate'] as const) {
    if (values[field].trim() && !dataValida(values[field].trim())) errors[field] = 'Informe uma data válida.';
  }
  if (Object.keys(errors).length) return errors;
  const acquisition = values.data_aquisicao.trim();
  const warranty = values.garantia_ate.trim();
  if (acquisition > hoje) errors.data_aquisicao = 'A aquisição não pode ser futura.';
  if (acquisition && warranty && warranty < acquisition) {
    errors.garantia_ate = 'A garantia não pode terminar antes da aquisição.';
  }
  return errors;
}

export function errosBem(values: PreenchimentoBem, hoje = hojeBem()): ErrosBem {
  return { ...errosTextos(values), ...errosDatas(values, hoje) };
}
