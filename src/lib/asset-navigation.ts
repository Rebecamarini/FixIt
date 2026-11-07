export type ConsultaBens = { busca?: string | string[]; pagina?: string | string[] };

export function consultaBens(params: ConsultaBens) {
  const busca = typeof params.busca === 'string' ? params.busca.trim() : '';
  const numero = typeof params.pagina === 'string' && /^[1-9]\d*$/.test(params.pagina) ? Number(params.pagina) : 1;
  return { busca, pagina: Number.isSafeInteger(numero) ? numero : 1 };
}

export function parametrosBens(busca: string, pagina: number) {
  return new URLSearchParams({ busca, pagina: String(pagina) }).toString();
}

export function listaBensUrl(busca: string, pagina: number) {
  return `/patrimonios?${parametrosBens(busca, pagina)}`;
}
