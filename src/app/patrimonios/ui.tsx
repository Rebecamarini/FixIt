import Link from 'next/link';
import styles from './page.module.css';

export function TelaPatrimonio({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <main className={styles.main}>
    <p className={styles.brand}>FixIt</p><h1>{titulo}</h1>
    {children}
  </main>;
}

export function ErroConsulta({ erro, voltar }: { erro: string; voltar: string }) {
  const sessao = erro === 'nao_autenticado';
  const restrito = erro === 'nao_autorizado';
  return <TelaPatrimonio titulo={sessao ? 'Sessão necessária' : restrito ? 'Acesso restrito' : 'Consulta indisponível'}>
    <p role="alert">{sessao ? 'Entre no FixIt com uma conta autorizada para consultar bens.' : restrito ? 'A consulta de bens é exclusiva para Gestor e Manutentor.' : 'Não foi possível consultar os bens. Tente novamente em instantes.'}</p>
    {sessao ? <Link href="/conta/entrar">Entrar</Link> : !restrito && <a href={voltar}>Tentar novamente</a>}
    <p><Link href="/">Voltar ao início</Link></p>
  </TelaPatrimonio>;
}

const mensagensResultado: Record<string, string> = {
  salvo: 'Alterações salvas.',
  sem_alteracoes_recuperado: 'Resultado recuperado: a tentativa original não tinha alterações. Os dados abaixo refletem a consulta atual.',
  salvo_recuperado: 'Edição confirmada. O resultado da tentativa foi recuperado; os dados abaixo refletem a consulta atual.',
  arquivado: 'Bem arquivado.',
  arquivado_recuperado: 'Arquivamento confirmado. O resultado da tentativa foi recuperado.',
  ja_arquivado: 'O bem já foi arquivado por outro Gestor.',
};
export function AvisoResultado({ resultado }: { resultado?: string | string[] }) {
  const message = typeof resultado === 'string' ? mensagensResultado[resultado] : undefined;
  return message ? <p role="status">{message}</p> : null;
}
