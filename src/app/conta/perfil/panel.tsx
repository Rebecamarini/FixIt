"use client";
import Link from "next/link";
import { useState } from "react";
import type { Perfil } from "../../../server/profile.ts";
import { ProfileForm } from "./form";

export function ProfilePanel({ perfil, loadError }: { perfil: Perfil | null; loadError?: string }) {
  const [previousPerfil, setPreviousPerfil] = useState(perfil);
  if (perfil && perfil.id !== previousPerfil?.id) setPreviousPerfil(perfil);
  const displayed = perfil ?? previousPerfil;
  return <>
    {loadError && <p role="alert">{loadError}</p>}
    {displayed ? <ProfileForm key={displayed.id} perfil={displayed} /> : <Link href="/">Voltar</Link>}
  </>;
}
