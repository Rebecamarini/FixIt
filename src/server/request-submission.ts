import 'server-only';
import { criarSolicitacao } from './requests.ts';
import { createSessionClient } from './session.ts';
import { obterIdentidade } from './identity.ts';
import { camposSolicitacao, errosPreenchimento, type Preenchimento } from '../lib/request-draft.ts';

// The page identity binds the preserved attempt even if another account signs in.
export async function enviarSolicitacao(input: unknown, tentativa: string, identidadeEsperada: string) {
  try {
    const client = await createSessionClient();
    const identity = await obterIdentidade(client);
    if (!identity) return { message: 'Sua sessão terminou. Entre novamente em outra aba e use Enviar novamente.', retry: true };
    if (identity.id !== identidadeEsperada) return { message: 'Entre novamente com a conta que abriu este formulário.', retry: true };
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { message: 'Preenchimento inválido.' };
    const raw = input as Record<string, unknown>;
    if (Object.keys(raw).some(key => !camposSolicitacao.some(([field]) => field === key) && !['modalidade', 'solicitante_id'].includes(key))
      || camposSolicitacao.some(([key]) => typeof raw[key] !== 'string')
      || !['proprio', 'outro'].includes(raw.modalidade as string) || typeof raw.solicitante_id !== 'string'
      || (raw.modalidade === 'proprio' && raw.solicitante_id !== '')) return { message: 'Preenchimento inválido.' };
    if (identity.papel !== 'Gestor' && raw.modalidade !== 'proprio') return { message: 'Você só pode solicitar em nome próprio.' };
    const values = Object.fromEntries(camposSolicitacao.map(([key]) => [key, (raw[key] as string).trim()])) as Preenchimento;
    const errors = errosPreenchimento(values);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(tentativa)) return { message: 'Tentativa inválida.' };
    if (values.categoria_id && !uuid.test(values.categoria_id)) errors.categoria_id = 'Selecione uma categoria cadastrada.';
    if (raw.modalidade === 'outro' && !uuid.test(raw.solicitante_id as string)) errors.solicitante_id = 'Selecione uma conta ativa.';
    if (Object.keys(errors).length) return { errors, message: 'Confira os campos indicados.' };
    const normalized = Object.fromEntries(camposSolicitacao.map(([key, , required]) => [key, !required && !values[key] ? null : values[key]]));
    const result = await criarSolicitacao(client, normalized, tentativa,
      raw.modalidade === 'outro' ? raw.solicitante_id as string : undefined, identidadeEsperada);
    if (result.data) return { confirmation: {
      id: result.data.id, estado: result.data.estado,
      representacao: result.data.solicitante_id !== result.data.autor_id,
      solicitante: result.solicitante_nome!, autor: result.autor_nome!, repetida: !!result.ja_registrada,
    } };
    if (result.erro === 'solicitante_indisponivel') return { errors: { solicitante_id: 'Selecione uma conta ativa. A conta escolhida pode ter sido excluída.' }, message: 'Confira o solicitante.' };
    if (result.erro === 'categoria_indisponivel') return { errors: { categoria_id: 'Selecione uma categoria cadastrada.' }, message: 'Confira a categoria.' };
    if (result.erro === 'resultado_incerto') return { message: 'Não foi possível confirmar o envio. A solicitação pode estar registrada. Use Enviar novamente.', retry: true };
    if (result.erro === 'nao_autenticado' || result.erro === 'nao_autorizado') return { message: 'Sua sessão mudou ou terminou. Entre novamente com a mesma conta em outra aba.', retry: true };
    return { message: 'Não foi possível gravar a solicitação. Confira os dados e tente novamente.' };
  } catch { return { message: 'Não foi possível confirmar o envio. A solicitação pode estar registrada. Use Enviar novamente.', retry: true }; }
}

export type EnvioSolicitacao = Awaited<ReturnType<typeof enviarSolicitacao>>;
