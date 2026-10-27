'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { camposSolicitacao, preenchimentoInicial, errosPreenchimento, type Preenchimento, type ErrosPreenchimento } from '../../../lib/request-draft.ts';
import { consultarCategorias, validarPreenchimento, buscarSolicitantes } from './actions';
import styles from './form.module.css';
import type { Papel } from '../../../server/identity.ts';

export default function FormularioSolicitacao({ papel }: { papel: Papel }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelLink = useRef<HTMLAnchorElement>(null);
  const leaving = useRef(false);
  const [modalidade, setModalidade] = useState('proprio');
  const [selected, setSelected] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<Awaited<ReturnType<typeof buscarSolicitantes>> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  async function find(page = 1, term = query) {
    setSearching(true); setSearchTerm(term);
    try { setSearch(await buscarSolicitantes(term, page)); }
    catch { setSearch({ items: [], total: 0, page, error: 'Não foi possível consultar os solicitantes.' }); }
    finally { setSearching(false); }
  }
  const [values, setValues] = useState<Preenchimento>(preenchimentoInicial);
  const [errors, setErrors] = useState<ErrosPreenchimento>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const form = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);
  useEffect(() => {
    if (!busy && focusPending.current) {
      focusPending.current = false;
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [busy, errors]);
  const dirty = Object.values(values).some(Boolean) || modalidade !== 'proprio' || selected !== null;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault(); event.returnValue = '';
    };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const traverse = (event: Event) => {
      if (!leaving.current && (event as Event & { navigationType: string }).navigationType === 'traverse' && event.cancelable) {
        event.preventDefault();
        if (!dialog.current?.open) dialog.current?.showModal();
      }
    };
    window.addEventListener('beforeunload', warn);
    navigation?.addEventListener('navigate', traverse);
    return () => { window.removeEventListener('beforeunload', warn); navigation?.removeEventListener('navigate', traverse); };
  }, [dirty]);
  async function loadCategories() {
    try {
      const result = await consultarCategorias();
      setCategories(result.items); setCategoryError(result.error);
    } catch { setCategoryError('Não foi possível consultar as categorias.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    consultarCategorias().then(result => {
      if (active) { setCategories(result.items); setCategoryError(result.error); setLoading(false); }
    }).catch(() => { if (active) { setCategoryError('Não foi possível consultar as categorias.'); setLoading(false); } });
    return () => { active = false; };
  }, []);
  return <><form ref={form} className={styles.form} noValidate onSubmit={async event => {
    event.preventDefault(); setAttempted(true); setBusy(true); setMessage('');
    try {
      const result = await validarPreenchimento({ ...values, modalidade, solicitante_id: modalidade === 'outro' ? selected?.id ?? '' : '' });
      setErrors(result.errors ?? {});
      if (result.errors?.solicitante_id) setSelected(null);
      if (result.values) setValues(Object.fromEntries(camposSolicitacao.map(([key]) => [key, result.values![key] ?? ''])) as Preenchimento);
      setMessage(result.message ?? (Object.keys(result.errors ?? {}).length ? 'Confira os campos indicados.' : 'Preenchimento válido. A solicitação ainda não foi enviada.'));
      focusPending.current = true;
    } catch { setMessage('Não foi possível validar. Tente novamente.'); }
    finally { setBusy(false); }
  }}>
    <p>Validar não envia a solicitação. O autor do futuro envio será você.</p>
    {papel === 'Gestor' ? <fieldset disabled={busy}>
      <legend>Solicitante</legend>
      <label><input type="radio" name="modalidade" checked={modalidade === 'proprio'} onChange={() => { setModalidade('proprio'); setSelected(null); setMessage(''); setErrors(current => ({ ...current, solicitante_id: undefined })); }} /> Em meu nome</label>
      <label><input type="radio" name="modalidade" checked={modalidade === 'outro'} onChange={() => { setModalidade('outro'); setMessage(''); if (attempted) setErrors(current => ({ ...current, solicitante_id: 'Selecione uma conta ativa.' })); }} /> Em nome de outra pessoa</label>
      {modalidade === 'outro' && <div>
        <label htmlFor="solicitante_id">Buscar por nome ou e-mail</label>
        <input id="solicitante_id" type="search" value={query} onChange={event => setQuery(event.target.value)} aria-invalid={!!errors.solicitante_id} aria-describedby={errors.solicitante_id ? 'solicitante-error' : undefined} />
        <button type="button" disabled={searching} onClick={() => find()}>Buscar</button>
        {errors.solicitante_id && <p id="solicitante-error" className={styles.error}>{errors.solicitante_id}</p>}
        {selected && <p role="status">Solicitante selecionado: {selected.nome} — {selected.email}</p>}
        <div role="status">{searching ? 'Buscando solicitantes…' : search?.error || (search && !search.items.length ? 'Nenhuma conta encontrada.' : '')}</div>
        {search?.error && <button type="button" disabled={searching} onClick={() => find(search.page, searchTerm)}>Tentar novamente</button>}
        {!searching && !search?.error && search && <>
          <ul className={styles.results}>{search.items.map(item => <li key={item.id}>
            <span>{item.nome} — {item.email} — {item.papel}</span>
            <button type="button" onClick={() => { setSelected(item); setMessage(''); setErrors(current => ({ ...current, solicitante_id: undefined })); }}>Selecionar {item.nome} — {item.email}</button>
          </li>)}</ul>
          <p>Página {search.page} — {search.total} contas</p>
          <button type="button" disabled={search.page <= 1} onClick={() => find(search.page - 1, searchTerm)}>Anterior</button>
          <button type="button" disabled={search.page * 20 >= search.total} onClick={() => find(search.page + 1, searchTerm)}>Próxima</button>
        </>}
      </div>}
    </fieldset> : <p>Em meu nome.</p>}
    <fieldset disabled={busy}>
      <legend>Informações da solicitação</legend>
      {camposSolicitacao.map(([key, label, required]) => <div key={key}>
        <label htmlFor={key}>{label} ({required ? 'obrigatório' : 'opcional'})</label>
        {key === 'categoria_id' ? <>
          <select id={key} value={values[key]} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={event => change(key, event.target.value)}>
            <option value="">Selecione uma categoria</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nome}</option>)}
          </select>
          <div role="status">{loading ? 'Carregando categorias…' : categoryError || (!categories.length ? 'Não há categorias cadastradas. Não é possível concluir o preenchimento.' : '')}</div>
          {categoryError && <button type="button" onClick={() => { setLoading(true); void loadCategories(); }}>Tentar novamente</button>}
        </> : <textarea id={key} rows={key === 'descricao' ? 4 : 2} value={values[key]} required={required} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={event => change(key, event.target.value)} />}
        {errors[key] && <span id={`${key}-error`} className={styles.error}>{errors[key]}</span>}
      </div>)}
      <button type="submit">{busy ? 'Validando…' : 'Validar preenchimento'}</button>
    </fieldset>
    <p role="status">{message}</p>
    <Link ref={cancelLink} href="/" onNavigate={event => {
      if (dirty) { event.preventDefault(); dialog.current?.showModal(); }
    }}>Cancelar</Link>
  </form>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="discard-title" onClose={() => cancelLink.current?.focus()}>
    <h2 id="discard-title">Descartar preenchimento?</h2>
    <p>Os dados preenchidos serão perdidos. A solicitação ainda não foi enviada.</p>
    <button type="button" autoFocus onClick={() => dialog.current?.close()}>Continuar preenchendo</button>
    <button type="button" onClick={() => { leaving.current = true; dialog.current?.close(); router.push('/'); }}>Descartar preenchimento</button>
  </dialog></>;
  function change(key: keyof Preenchimento, value: string) {
    const next = { ...values, [key]: value }; setValues(next); setMessage('');
    if (attempted) setErrors(current => ({ ...current, [key]: errosPreenchimento(next)[key] }));
  }
}
