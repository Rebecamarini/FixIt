'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { camposBem, estadosConservacao, hojeBem } from '../../../lib/asset-form.ts';
import type { ResultadoBem } from '../../../server/assets.ts';
import { useAssetForm } from './use-asset-form';
import styles from '../../solicitacoes/nova/form.module.css';
import assetStyles from './form.module.css';

type State = Omit<ReturnType<typeof useAssetForm>, 'form'>;

export default function FormularioBem({ enviar }: { enviar: (input: unknown, tentativa: string) => Promise<ResultadoBem> }) {
  const { form, ...state } = useAssetForm(enviar);
  if (state.result.confirmation) return <Confirmation data={state.result.confirmation} reset={state.reset} />;
  return <form ref={form} className={`${styles.form} ${assetStyles.form}`} noValidate onSubmit={state.send}>
    <p>O código do bem será gerado ao salvar. Campos opcionais podem ficar em branco.</p>
    <fieldset disabled={state.busy || state.result.retry}>
      <legend>Dados do bem</legend>
      {camposBem.map(([field]) => <AssetField key={field} field={field} state={state} />)}
    </fieldset>
    <button type="submit" disabled={state.busy}>{state.busy ? 'Salvando…' : state.result.retry ? 'Conferir cadastro' : 'Salvar bem'}</button>
    {state.result.retry && <p>Os dados estão preservados até confirmar o resultado. Se a sessão terminou, <a href="/conta/entrar" target="_blank" rel="noopener noreferrer">entre com a mesma conta em outra aba</a>.</p>}
    <p role="status">{state.result.message}</p>
    {!state.busy && !state.result.retry && <Link href="/" onNavigate={event => {
      if (state.dirty && !window.confirm('Descartar preenchimento? Os dados não serão salvos.')) event.preventDefault();
    }}>Cancelar</Link>}
  </form>;
}

function AssetField({ field, state }: { field: keyof State['values']; state: State }) {
  const definition = camposBem.find(([key]) => key === field)!;
  const [, label, required, ...limits] = definition;
  const error = state.result.errors?.[field];
  const props = {
    id: field, name: field, value: state.values[field], required,
    'aria-invalid': !!error, 'aria-describedby': error ? `${field}-error` : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => state.change(field, event.target.value),
  };
  return <div>
    <label htmlFor={field}>{label} ({required ? 'obrigatório' : 'opcional'})</label>
    {field === 'estado_conservacao' ? <select {...props}><option value="">Selecione o estado</option>{estadosConservacao.map(value => <option key={value}>{value}</option>)}</select>
      : field === 'descricao' ? <textarea {...props} rows={4} maxLength={limits[0]} />
        : <input {...props} type={field === 'data_aquisicao' || field === 'garantia_ate' ? 'date' : 'text'} maxLength={limits[0]} max={field === 'data_aquisicao' ? hojeBem() : undefined} />}
    {error && <span id={`${field}-error`} className={styles.error}>{error}</span>}
  </div>;
}

function Confirmation({ data, reset }: { data: NonNullable<ResultadoBem['confirmation']>; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className={`${styles.form} ${assetStyles.summary}`} aria-labelledby="confirmation-title">
    <h2 id="confirmation-title" tabIndex={-1} ref={heading}>Bem cadastrado</h2>
    {data.repetida && <p role="status">Este bem já foi cadastrado. A confirmação foi recuperada.</p>}
    <dl><dt>Código patrimonial</dt><dd data-testid="codigo-bem">{data.codigo}</dd>
      {camposBem.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{displayValue(key, data[key])}</dd></div>)}
      <dt>Situação no inventário</dt><dd>{data.ativo ? 'Ativo' : 'Arquivado'}</dd>
    </dl>
    <button type="button" onClick={reset}>Cadastrar outro</button>
    <Link href="/">Voltar ao início</Link>
  </section>;
}

function displayValue(key: string, value: string | null) {
  if (!value) return 'Não informado';
  if (key === 'data_aquisicao' || key === 'garantia_ate') return value.split('-').reverse().join('/');
  return value;
}
