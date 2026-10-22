"use client";

import Link from "next/link";
import { useActionState, useState, type ComponentProps } from "react";
import type { AccountState } from "../../server/account.ts";
import { cadastrar, entrar, sair } from "./actions";
import styles from "./form.module.css";

type FieldProps = { state: AccountState; name: keyof NonNullable<AccountState["values"]> | "senha"; label: string } & ComponentProps<"input">;

function Field({ state, name, label, ...input }: FieldProps) {
  const error = state.errors?.[name];
  const defaultValue = name === "senha" ? undefined : state.values?.[name] ?? "";
  return <div>
    <label htmlFor={name}>{label}</label>
    <input id={name} name={name} required defaultValue={defaultValue} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...input} />
    {error && <span id={`${name}-error`} className={styles.error}>{error}</span>}
  </div>;
}

function PasswordField({ state, cadastro, senha, setSenha }: {
  state: AccountState; cadastro: boolean; senha: string; setSenha: (senha: string) => void;
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  return <div>
    <Field state={state} name="senha" label={cadastro ? "Senha (mínimo de 8 caracteres)" : "Senha"}
      type={mostrarSenha ? "text" : "password"} autoComplete={cadastro ? "new-password" : "current-password"}
      minLength={cadastro ? 8 : undefined} value={senha} onChange={event => setSenha(event.target.value)} />
    <label className={styles.checkbox}><input type="checkbox" checked={mostrarSenha} onChange={event => setMostrarSenha(event.target.checked)} /> Mostrar senha</label>
  </div>;
}

function RegistrationFields({ state, setores }: { state: AccountState; setores: { id: string; nome: string }[] }) {
  const error = state.errors?.setor_id;
  return <>
    <Field state={state} name="matricula" label="Matrícula" type="text" />
    <div>
      <label htmlFor="setor_id">Setor</label>
      <select key={state.values?.setor_id ?? ""} id="setor_id" name="setor_id" required defaultValue={state.values?.setor_id ?? ""} aria-invalid={Boolean(error)} aria-describedby={error ? "setor_id-error" : undefined}>
        <option value="">Selecione seu setor</option>
        {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
      </select>
      {error && <span id="setor_id-error" className={styles.error}>{error}</span>}
    </div>
  </>;
}

export function AccountForm({ cadastro = false, setores = [] }: {
  cadastro?: boolean;
  setores?: { id: string; nome: string }[];
}) {
  const [senha, setSenha] = useState("");
  const [state, action, pending] = useActionState(async (previous: AccountState, data: FormData) => {
    setSenha("");
    return (cadastro ? cadastrar : entrar)(previous, data);
  }, {});

  return (
    <form action={action} className={styles.form} aria-busy={pending}>
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      {cadastro && <Field state={state} name="nome" label="Nome" autoComplete="name" />}
      <Field state={state} name="email" label="E-mail" type="email" autoComplete="email" />
      <PasswordField state={state} cadastro={cadastro} senha={senha} setSenha={setSenha} />
      {cadastro && <RegistrationFields state={state} setores={setores} />}
      <button type="submit" disabled={pending}>{pending ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}</button>
      <p>{cadastro ? <>Já tem conta? <Link href="/conta/entrar">Entrar</Link></> : <>Ainda não tem conta? <Link href="/conta/cadastrar">Criar conta</Link></>}</p>
    </form>
  );
}

export function LogoutForm() {
  const [state, action, pending] = useActionState(sair, {});
  return <form action={action} className={styles.form}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "Saindo…" : "Sair"}</button>
  </form>;
}
