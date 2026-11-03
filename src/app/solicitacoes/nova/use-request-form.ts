'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { preenchimentoInicial, errosPreenchimento, type Preenchimento, type ErrosPreenchimento } from '../../../lib/request-draft.ts';
import { consultarCategorias, buscarSolicitantes } from './actions';
import type { EnvioSolicitacao } from '../../../server/request-submission.ts';

type Enviar = (input: unknown, tentativa: string) => Promise<EnvioSolicitacao>;

function useDraft() {
  const [values, setValues] = useState<Preenchimento>(preenchimentoInicial);
  const [errors, setErrors] = useState<ErrosPreenchimento>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  function change(key: keyof Preenchimento, value: string) {
    const next = { ...values, [key]: value }; setValues(next); setMessage('');
    if (attempted) setErrors(current => ({ ...current, [key]: errosPreenchimento(next)[key] }));
  }
  return { values, setValues, errors, setErrors, attempted, setAttempted, message, setMessage, change };
}

function useRequester() {
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
  return { modalidade, setModalidade, selected, setSelected, query, setQuery, search, setSearch, searching, searchTerm, find };
}

function useCategories() {
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(true);
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
  return { categories, categoryError, loading, setLoading, loadCategories };
}

function useSubmission(enviar: Enviar, draft: ReturnType<typeof useDraft>, requester: ReturnType<typeof useRequester>) {
  const submit = useRef(enviar);
  const attempt = useRef<string | null>(null);
  const submitting = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const [confirmation, setConfirmation] = useState<NonNullable<EnvioSolicitacao['confirmation']> | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);
  useEffect(() => {
    if (!busy && focusPending.current) {
      focusPending.current = false;
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [busy, draft.errors]);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; draft.setAttempted(true); setBusy(true); draft.setMessage('');
    attempt.current ??= crypto.randomUUID();
    try {
      const result = await submit.current({ ...draft.values, modalidade: requester.modalidade, solicitante_id: selectedRequester(requester) }, attempt.current);
      draft.setErrors(result.errors ?? {});
      if (result.errors?.solicitante_id) requester.setSelected(null);
      if (result.confirmation) { setConfirmation(result.confirmation); setUncertain(false); }
      else {
        draft.setMessage(result.message ?? 'Confira os campos indicados.');
        setUncertain(!!result.retry);
        if (!result.retry) attempt.current = null;
        focusPending.current = true;
      }
    } catch {
      setUncertain(true); draft.setMessage('Não foi possível confirmar o envio. A solicitação pode estar registrada. Use Enviar novamente.');
    } finally { submitting.current = false; setBusy(false); }
  }
  function resetSubmission() {
    attempt.current = null; setUncertain(false); setConfirmation(null);
  }
  return { form, send, resetSubmission, uncertain, confirmation, busy };
}

function selectedRequester(requester: ReturnType<typeof useRequester>) {
  return requester.modalidade === 'outro' ? requester.selected?.id ?? '' : '';
}

function useDiscard(dirty: boolean) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelLink = useRef<HTMLAnchorElement>(null);
  const leaving = useRef(false);
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
  function discard() {
    leaving.current = true; dialog.current?.close(); router.push('/');
  }
  function showDiscard() { dialog.current?.showModal(); }
  function closeDiscard() { dialog.current?.close(); }
  function focusCancel() { cancelLink.current?.focus(); }
  return { dialog, cancelLink, discard, showDiscard, closeDiscard, focusCancel };
}

export function useRequestForm(enviar: Enviar) {
  const draft = useDraft();
  const requester = useRequester();
  const categories = useCategories();
  const submission = useSubmission(enviar, draft, requester);
  const dirty = !submission.confirmation && (Object.values(draft.values).some(Boolean) || requester.modalidade !== 'proprio' || requester.selected !== null);
  const discard = useDiscard(dirty);
  function reset() {
    draft.setValues(preenchimentoInicial); requester.setModalidade('proprio'); requester.setSelected(null);
    requester.setQuery(''); requester.setSearch(null); draft.setErrors({}); draft.setMessage(''); draft.setAttempted(false);
    submission.resetSubmission();
  }
  return { ...draft, ...requester, ...categories, ...submission, ...discard, dirty, reset };
}
