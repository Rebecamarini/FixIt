import "server-only";

export function getSupabaseConfig(env: Record<string, string | undefined> = process.env) {
  try {
    const target = env.SUPABASE_TARGET;
    if (target !== "local" && target !== "cloud") throw new Error();
    const url = new URL(env.SUPABASE_URL ?? "");
    const local = url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname) && url.port === "54321";
    const cloud = url.protocol === "https:" && /^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) && !url.port;
    if (!(target === "local" ? local : cloud) || url.pathname !== "/" || url.username || url.password || url.search || url.hash) throw new Error();
    const publishableKey = env.SUPABASE_PUBLISHABLE_KEY ?? "";
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
      const parts = publishableKey.split(".");
      if (parts.length !== 3 || JSON.parse(Buffer.from(parts[1], "base64url").toString()).role !== "anon") throw new Error();
    }
    return { target, url: url.origin, publishableKey };
  } catch {
    throw new Error("Configuração inválida: confira SUPABASE_TARGET (local/cloud), SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em .env.local seguindo .env.example. Use somente chave Publishable ou anon; nunca credenciais administrativas.");
  }
}
