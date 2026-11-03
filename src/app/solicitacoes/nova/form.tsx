'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { camposSolicitacao, type CampoSolicitacao } from '../../../lib/request-draft.ts';
import { useRequestForm } from './use-request-form';
import styles from './form.module.css';
import type { EnvioSolicitacao } from '../../../server/request-submission.ts';
import type { Papel } from '../../../server/identity.ts';

type FormState = Omit<ReturnType<typeof useRequestForm>, 'form' | 'cancelLink'>;

export default function FormularioSolicitacao({ papel, enviar }: { papel: Papel; enviar: (input: unknown, tentativa: string) => Promise<EnvioSolicitacao> }) {
  const { form, cancelLink, ...state } = useRequestForm(enviar);
  if (state.confirmation) return <Confirmation confirmation={state.confirmation} reset={state.reset} />;
  return <>
    <form ref={form} className={styles.form} noValidate onSubmit={state.send}>
      <p>O autor do envio será você.</p>
      {papel === 'Gestor' ? <Requester state={state} /> : <p>Em meu nome.</p>}
      <fieldset disabled={state.busy || state.uncertain}>
        <legend>Informações da solicitação</legend>
        {camposSolicitacao.map(([key, label, required]) => <RequestField key={key} field={key} label={label} required={required} state={state} />)}
      </fieldset>
      <button type="submit" disabled={state.busy}>{state.busy ? 'Enviando…' : state.uncertain ? 'Enviar novamente' : 'Enviar solicitação'}</button>
      {state.uncertain && <p>Os dados estão preservados até confirmar o resultado. Para entrar novamente, <a href="/conta/entrar" target="_blank" rel="noopener noreferrer">abra o login em outra aba</a>.</p>}
      <p role="status">{state.message}</p>
      <Link ref={cancelLink} href="/" onNavigate={event => {
        if (state.dirty) { event.preventDefault(); state.showDiscard(); }
      }}>Cancelar</Link>
    </form>
    <DiscardDialog state={state} />
  </>;
}

function Confirmation({ confirmation, reset }: { confirmation: NonNullable<EnvioSolicitacao['confirmation']>; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section aria-labelledby="confirmation-title">
    <h2 id="confirmation-title" tabIndex={-1} ref={heading}>Solicitação registrada</h2>
    {confirmation.repetida && <p role="status">Esta solicitação já foi registrada.</p>}
    <p>Identificador: {confirmation.id}</p><p>Estado: {confirmation.estado}</p>
    {confirmation.representacao && <><p>Solicitante: {confirmation.solicitante}</p><p>Autor do envio: {confirmation.autor}</p></>}
    <button type="button" onClick={reset}>Nova solicitação</button>
    <Link href="/">Voltar ao início</Link>
  </section>;
}

function Requester({ state }: { state: FormState }) {
  return <fieldset disabled={state.busy || state.uncertain}>
    <legend>Solicitante</legend>
    <label><input type="radio" name="modalidade" checked={state.modalidade === 'proprio'} onChange={() => {
      state.setModalidade('proprio'); state.setSelected(null); state.setMessage('');
      state.setErrors(current => ({ ...current, solicitante_id: undefined }));
    }} /> Em meu nome</label>
    <label><input type="radio" name="modalidade" checked={state.modalidade === 'outro'} onChange={() => {
      state.setModalidade('outro'); state.setMessage('');
      if (state.attempted) state.setErrors(current => ({ ...current, solicitante_id: 'Selecione uma conta ativa.' }));
    }} /> Em nome de outra pessoa</label>
    {state.modalidade === 'outro' && <RequesterSearch state={state} />}
  </fieldset>;
}

function RequesterSearch({ state }: { state: FormState }) {
  const { search, searching, selected } = state;
  return <div>
    <label htmlFor="solicitante_id">Buscar por nome ou e-mail</label>
    <input id="solicitante_id" type="search" value={state.query} onChange={event => state.setQuery(event.target.value)} aria-invalid={!!state.errors.solicitante_id} aria-describedby={state.errors.solicitante_id ? 'solicitante-error' : undefined} />
    <button type="button" disabled={searching} onClick={() => state.find()}>Buscar</button>
    {state.errors.solicitante_id && <p id="solicitante-error" className={styles.error}>{state.errors.solicitante_id}</p>}
    {selected && <p role="status">Solicitante selecionado: {selected.nome} — {selected.email}</p>}
    <div role="status">{requesterStatus(state)}</div>
    {search?.error && <button type="button" disabled={searching} onClick={() => state.find(search.page, state.searchTerm)}>Tentar novamente</button>}
    {!searching && !search?.error && search && <RequesterResults state={state} search={search} />}
  </div>;
}

function requesterStatus({ searching, search }: FormState) {
  if (searching) return 'Buscando solicitantes…';
  return search?.error || (search && !search.items.length ? 'Nenhuma conta encontrada.' : '');
}

function RequesterResults({ state, search }: { state: FormState; search: NonNullable<FormState['search']> }) {
  return <>
    <ul className={styles.results}>{search.items.map(item => <li key={item.id}>
      <span>{item.nome} — {item.email} — {item.papel}</span>
      <button type="button" onClick={() => {
        state.setSelected(item); state.setMessage(''); state.setErrors(current => ({ ...current, solicitante_id: undefined }));
      }}>Selecionar {item.nome} — {item.email}</button>
    </li>)}</ul>
    <p>Página {search.page} — {search.total} contas</p>
    <button type="button" disabled={search.page <= 1} onClick={() => state.find(search.page - 1, state.searchTerm)}>Anterior</button>
    <button type="button" disabled={search.page * 20 >= search.total} onClick={() => state.find(search.page + 1, state.searchTerm)}>Próxima</button>
  </>;
}

function RequestField({ field, label, required, state }: { field: CampoSolicitacao; label: string; required: boolean; state: FormState }) {
  return <div>
    <label htmlFor={field}>{label} ({required ? 'obrigatório' : 'opcional'})</label>
    {field === 'categoria_id' ? <CategoryField state={state} /> : <textarea id={field} rows={field === 'descricao' ? 4 : 2} value={state.values[field]} required={required} aria-invalid={!!state.errors[field]} aria-describedby={state.errors[field] ? `${field}-error` : undefined} onChange={event => state.change(field, event.target.value)} />}
    {state.errors[field] && <span id={`${field}-error`} className={styles.error}>{state.errors[field]}</span>}
  </div>;
}

function CategoryField({ state }: { state: FormState }) {
  return <>
    <select id="categoria_id" value={state.values.categoria_id} aria-invalid={!!state.errors.categoria_id} aria-describedby={state.errors.categoria_id ? 'categoria_id-error' : undefined} onChange={event => state.change('categoria_id', event.target.value)}>
      <option value="">Selecione uma categoria</option>{state.categories.map(category => <option key={category.id} value={category.id}>{category.nome}</option>)}
    </select>
    <div role="status">{state.loading ? 'Carregando categorias…' : state.categoryError || (!state.categories.length ? 'Não há categorias cadastradas. Não é possível concluir o preenchimento.' : '')}</div>
    {state.categoryError && <button type="button" onClick={() => { state.setLoading(true); void state.loadCategories(); }}>Tentar novamente</button>}
  </>;
}

function DiscardDialog({ state: { dialog, ...state } }: { state: FormState }) {
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="discard-title" onClose={state.focusCancel}>
    <h2 id="discard-title">Descartar preenchimento?</h2>
    <p>{state.uncertain || state.busy ? 'A solicitação pode já estar registrada. Ao sair, os dados serão perdidos e um novo preenchimento será outro pedido.' : 'Os dados preenchidos serão perdidos. A solicitação ainda não foi enviada.'}</p>
    <button type="button" autoFocus onClick={state.closeDiscard}>Continuar preenchendo</button>
    <button type="button" onClick={state.discard}>Descartar preenchimento</button>
  </dialog>;
}
