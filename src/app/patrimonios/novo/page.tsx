import Link from 'next/link';
import { redirect } from 'next/navigation';
import { obterIdentidade } from '../../../server/identity.ts';
import { createSessionClient } from '../../../server/session.ts';
import { cadastrarBem } from '../../../server/assets.ts';
import FormularioBem from './form';
import styles from '../../page.module.css';

export const dynamic = 'force-dynamic';

export default async function NovoBemPage() {
  let identity;
  try { identity = await obterIdentidade(await createSessionClient()); }
  catch {
    return <main className={styles.main}><h1>Cadastrar bem patrimonial</h1><p role="alert">Não foi possível verificar sua sessão. Tente novamente em instantes.</p><Link href="/">Voltar ao início</Link></main>;
  }
  if (!identity) redirect('/conta/entrar');
  if (identity.papel !== 'Gestor') redirect('/');
  const author = identity.id;
  async function enviar(input: unknown, tentativa: string) {
    'use server';
    return cadastrarBem(await createSessionClient(), input, tentativa, author);
  }
  return <main className={styles.main}>
    <p className={styles.brand}>FixIt</p>
    <h1>Cadastrar bem patrimonial</h1>
    <FormularioBem enviar={enviar} />
  </main>;
}
