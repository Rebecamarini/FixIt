"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "../../app/conta/form";
import styles from "./Sidebar.module.css";
type SidebarProps = { inicioHref?: string; demonstracao?: boolean };

export default function Sidebar({ inicioHref = "/", demonstracao = false }: SidebarProps) {
    const pathname = usePathname();
    const solicitacoesHref = demonstracao ? "/demo/cliente/solicitacoes" : "/solicitacoes";
    const novoHref = demonstracao ? "/demo/solicitacao" : "/solicitacoes/nova";
    const itens = [
        { href: demonstracao ? "/demo/cliente" : inicioHref, texto: "Visão geral", icone: "▦", ativo: pathname === (demonstracao ? "/demo/cliente" : inicioHref) },
        { href: solicitacoesHref, texto: "Meus chamados", icone: "▤", ativo: pathname.startsWith(solicitacoesHref) && pathname !== novoHref },
        { href: novoHref, texto: "Novo chamado", icone: "＋", ativo: pathname === novoHref },
    ];
    return (
        <aside className={styles.sidebar}>
        <div className={styles.logo}>
            <span className={styles.logoIcon}>✚</span>

            <div>
                <strong>FixIt</strong>
                <p>MANUTENÇÃO SIMPLIFICADA</p>
                </div>
            </div>

            <nav className={styles.menu} aria-label="Navegação do Cliente">
                {itens.map((item) => (
                    <Link key={item.href} href={item.href} aria-current={item.ativo ? "page" : undefined}>
                        <span aria-hidden="true">{item.icone}</span>{item.texto}
                    </Link>
                ))}
            </nav>
        <div className ={styles.footer}>
            <div className={styles.identificacao}>
                <strong>FixIt</strong>
                <p>Sistema de gerenciamento de manutenção</p>
            </div>
            <div className={styles.saida}>
                {demonstracao ? <Link href="/conta/entrar">Sair</Link> : <LogoutForm />}
            </div>
        </div>
    </aside>
    );
}
