import "server-only";

function validOrigin(url: URL, target: "local" | "cloud") {
  return target === "local"
    ? url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname) && url.port === "54321"
    : url.protocol === "https:" && /^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) && !url.port;
}

function validUrl(url: URL, target: "local" | "cloud") {
  return validOrigin(url, target) && url.pathname === "/" && !url.username && !url.password && !url.search && !url.hash;
}

function publicKey(key: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  return parts.length === 3 && JSON.parse(Buffer.from(parts[1], "base64url").toString()).role === "anon";
}

export function getSupabaseConfig(env: Record<string, string | undefined> = process.env) {
  try {
    const target = env.SUPABASE_TARGET;
    if (target !== "local" && target !== "cloud") throw new Error();
    const url = new URL(env.SUPABASE_URL ?? "");
    if (!validUrl(url, target)) throw new Error();
    const publishableKey = env.SUPABASE_PUBLISHABLE_KEY ?? "";
    if (!publicKey(publishableKey)) throw new Error();
    return { target, url: url.origin, publishableKey };
  } catch {
    throw new Error("Configuração inválida: confira SUPABASE_TARGET (local/cloud), SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em .env.local seguindo .env.example. Use somente chave Publishable ou anon; nunca credenciais administrativas.");
  }
}
