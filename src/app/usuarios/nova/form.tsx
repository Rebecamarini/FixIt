"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { AdminState } from "../../../server/admin-accounts.ts";
import { criar, conferir } from "../actions";
import styles from "../../conta/form.module.css";

export function CreateAccountForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(async (_previous: AdminState, form: FormData) => {
    setPassword("");
    return (_previous.creationId ? conferir : criar)(_previous, form);
  }, {});
  const error = (name: string) => state.errors?.[name] ? <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span> : null;
  const invalid = (name: string) => ({ "aria-invalid": Boolean(state.errors?.[name]), "aria-describedby": state.errors?.[name] ? `${name}-error` : undefined });
  return <form action={action} noValidate className={styles.form} aria-busy={pending}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {state.creationId && <input type="hidden" name="criacao_id" value={state.creationId} />}
    <div><label htmlFor="nome">Nome</label><input id="nome" name="nome" required readOnly={Boolean(state.creationId)} autoComplete="name" defaultValue={state.values?.nome ?? ""} {...invalid("nome")} />{error("nome")}</div>
    <div><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" required readOnly={Boolean(state.creationId)} autoComplete="email" defaultValue={state.values?.email ?? ""} {...invalid("email")} />{error("email")}</div>
    <div><label htmlFor="papel">Papel</label><select key={state.values?.papel ?? ""} id="papel" name="papel" required disabled={Boolean(state.creationId)} defaultValue={state.values?.papel ?? ""} {...invalid("papel")}><option value="">Selecione o papel</option><option>Manutentor</option><option>Gestor</option></select>{error("papel")}</div>
    {!state.creationId && <div><label htmlFor="senha">Senha inicial (mínimo de 8 caracteres)</label><input id="senha" name="senha" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} {...invalid("senha")} />{error("senha")}<label className={styles.checkbox}><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} /> Mostrar senha</label></div>}
    <button type="submit" disabled={pending}>{pending ? "Aguarde…" : state.creationId ? "Conferir criação" : "Criar conta"}</button>
    <Link href="/usuarios" aria-disabled={pending} onClick={event => { if (pending) event.preventDefault(); else { setPassword(""); setShowPassword(false); } }}>Cancelar</Link>
  </form>;
}
