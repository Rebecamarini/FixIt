import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { obterIdentidade } from './identity.ts';

type ResumoBem = { id: string; codigo: string; descricao: string; localizacao: string; estado_conservacao: string };
export type DetalhesBem = ResumoBem & { marca: string | null; modelo: string | null; data_aquisicao: string | null; garantia_ate: string | null; versao: number };
type Resultado<T> = { data: T | null; erro: null | 'nao_autenticado' | 'nao_autorizado' | 'nao_encontrado' | 'falha_consulta' };
type PaginaBens = { itens: ResumoBem[]; pagina: number; total: number };

async function acesso(client: SupabaseClient): Promise<Resultado<never>['erro']> {
  const identidade = await obterIdentidade(client);
  if (!identidade) return 'nao_autenticado';
  return ['Gestor', 'Manutentor'].includes(identidade.papel) ? null : 'nao_autorizado';
}

function falha(codigo?: string): Resultado<never> {
  return { data: null, erro: codigo === '42501' ? 'nao_autorizado' : 'falha_consulta' };
}

export async function listarBens(client: SupabaseClient, busca = '', pagina = 1): Promise<Resultado<PaginaBens>> {
  try {
    const erro = await acesso(client);
    if (erro) return { data: null, erro };
    const { data, error } = await client.rpc('us026_listar_bens', {
      busca: busca.trim(), pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1,
    });
    if (error || !data) return falha(error?.code);
    return { data, erro: null };
  } catch { return { data: null, erro: 'falha_consulta' }; }
}

export async function obterBem(client: SupabaseClient, id: string): Promise<Resultado<DetalhesBem>> {
  try {
    const erro = await acesso(client);
    if (erro) return { data: null, erro };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { data: null, erro: 'nao_encontrado' };
    const { data, error } = await client.from('bens_patrimoniais')
      .select('id,codigo,descricao,localizacao,estado_conservacao,marca,modelo,data_aquisicao,garantia_ate,versao').eq('id', id).maybeSingle();
    if (error) return falha(error.code);
    return data ? { data, erro: null } : { data: null, erro: 'nao_encontrado' };
  } catch { return { data: null, erro: 'falha_consulta' }; }
}
