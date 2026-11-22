"use client";

import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

type HeaderProps = {
  nome: string;
};

export default function Header({ nome }: HeaderProps) {
  const pathname = usePathname();

  const paginas: Record<string, string> = {
    "/": "Visão geral",
    "/demo/cliente": "Visão geral",
    "/demo/cliente/solicitacoes": "Meus chamados",
    "/demo/solicitacao": "Novo chamado",
    "/solicitacoes": "Meus chamados",
    "/solicitacoes/nova": "Novo chamado",
    "/conta/perfil": "Meu perfil",
  };
    const paginaAtual = paginas[pathname] ?? "Detalhes do chamado";
    return(
        <header className ={styles.header}>
            <div className={styles.breadcrumb}>
            <span>FixIt</span>
            <span aria-hidden="true">/</span>
            <span>{paginaAtual}</span>
            </div>

            <div className={styles.usuario}>
            <span className={styles.nome}>Cliente · {nome}</span>

            <div className={styles.avatar} aria-hidden="true">
            {nome.charAt(0).toUpperCase()}
            </div>
         </div>
     </header>
    );
}
