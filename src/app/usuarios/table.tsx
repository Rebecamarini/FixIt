"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AccountListItem, AdminState } from "../../server/admin-accounts.ts";
import { excluir } from "./actions";
import styles from "./usuarios.module.css";
import formStyles from "../conta/form.module.css";
import modalStyles from "../conta/perfil/modal.module.css";

function DeleteConfirmation({ account, busy, onCancel, onConfirm }: {
  account: AccountListItem; busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal(); cancel.current?.focus();
    return () => { element.close(); opener?.focus(); };
  }, []);
  return <dialog ref={dialog} className={modalStyles.dialog} aria-labelledby="delete-title" aria-describedby="delete-consequences" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="delete-title">Excluir conta</h2>
    <p><strong>{account.nome}</strong></p><p style={{ overflowWrap: "anywhere" }}>{account.email}</p><p>Papel: {account.papel}</p>
    <p id="delete-consequences">A exclusão encerra o acesso e é irreversível. Um recadastro terá nova identidade e não recuperará os vínculos anteriores. As solicitações e o histórico serão preservados.</p>
    <div className={formStyles.form} aria-busy={busy}>
      <button ref={cancel} type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
      <button type="button" disabled={busy} onClick={onConfirm}>{busy ? "Excluindo…" : "Confirmar exclusão"}</button>
    </div>
  </dialog>;
}

export function AccountTable({ items, ownId }: { items: AccountListItem[]; ownId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<AdminState>({});
  const [selected, setSelected] = useState<AccountListItem | null>(null);
  const [retryAccount, setRetryAccount] = useState<AccountListItem | null>(null);
  const [pending, startTransition] = useTransition();
  async function remove(account: AccountListItem) {
    setBusy(true); setState({});
    const form = new FormData(); form.set("id", account.id);
    try {
      const result = await excluir({}, form);
      setState(result); setRetryAccount(result.retryable ? account : null); setSelected(null);
      if (result.success) startTransition(() => router.refresh());
    } catch {
      setSelected(null); setRetryAccount(account);
      setState({ message: "Não foi possível confirmar a exclusão. Tente novamente para conferir o resultado." });
    } finally { setBusy(false); }
  }
  return <>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
    {retryAccount && <button className={styles.retry} type="button" disabled={pending || busy} onClick={() => void remove(retryAccount)}>Tentar exclusão novamente</button>}
    {selected && <DeleteConfirmation account={selected} busy={busy} onCancel={() => setSelected(null)} onConfirm={() => void remove(selected)} />}
    {items.length > 0 && <div className={styles.tableContainer}><table className={styles.table}>
      <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Papel</th><th scope="col">Ações</th></tr></thead>
      <tbody>{items.map(account => <tr key={account.id}>
        <td>{account.nome}</td><td>{account.email}</td><td>{account.papel}</td>
        <td>{account.id !== ownId && <button type="button" aria-label={`Excluir conta de ${account.nome}`} disabled={pending || busy} onClick={() => setSelected(account)}>Excluir</button>}</td>
      </tr>)}</tbody>
    </table></div>}
  </>;
}
