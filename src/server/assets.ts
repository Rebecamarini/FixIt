import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { obterIdentidade } from './identity.ts';
import { normalizarBem, errosBem, type PreenchimentoBem, type ErrosBem } from '../lib/asset-form.ts';

type ConfirmacaoBem = {
  id: string; codigo: string; descricao: string; localizacao: string; estado_conservacao: string;
  marca: string | null; modelo: string | null; data_aquisicao: string | null; garantia_ate: string | null;
  ativo: boolean; repetida: boolean;
};
export type ResultadoBem = { confirmation?: ConfirmacaoBem; errors?: ErrosBem; message?: string; retry?: boolean };

const uncertain: ResultadoBem = { retry: true, message: 'Não foi possível confirmar o cadastro. O bem pode estar registrado. Use Conferir cadastro.' };
const denied: ResultadoBem = { retry: true, message: 'Sua sessão mudou ou terminou. Entre novamente com a mesma conta de Gestor em outra aba.' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function gravarBem(client: SupabaseClient, values: PreenchimentoBem, tentativa: string, identidade: string): Promise<ResultadoBem> {
    const { data, error } = await client.rpc('us025_cadastrar_bem', { dados: values, tentativa, identidade });
    if (error?.code === '42501') return denied;
    if (error && ['22023', '23514', '23502', '22007', '22008', '22P02'].includes(error.code)) {
      return { message: 'Confira os dados e as datas informadas.' };
    }
    if (error || !data) return uncertain;
    return { confirmation: data };
}

export async function cadastrarBem(client: SupabaseClient, input: unknown, tentativa: string, identidadeEsperada: string): Promise<ResultadoBem> {
  try {
    const identity = await obterIdentidade(client);
    if (!identity || identity.id !== identidadeEsperada || identity.papel !== 'Gestor') return denied;
    if (typeof tentativa !== 'string' || !uuid.test(tentativa)) return { message: 'Tentativa de cadastro inválida.' };
    const values = normalizarBem(input);
    if (!values) return { message: 'Preenchimento inválido.' };
    const errors = errosBem(values);
    if (Object.keys(errors).length) return { errors, message: 'Confira os campos indicados.' };
    return await gravarBem(client, values, tentativa, identity.id);
  } catch { return uncertain; }
}
