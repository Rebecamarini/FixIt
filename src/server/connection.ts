import "server-only";

export type ConnectionStatus = {
  status: "connected" | "configuration-error" | "unavailable";
  message: string;
};

// Interface compartilhada pela página inicial e pelo comando de diagnóstico.
export async function checkConnection(
  env: Record<string, string | undefined> = process.env,
): Promise<ConnectionStatus> {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return {
      status: "configuration-error",
      message: "Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em .env.local seguindo .env.example.",
    };
  }
  try {
    const url = new URL(env.SUPABASE_URL);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.port !== "54321" || url.pathname !== "/" ||
      url.username || url.password || url.search || url.hash
    ) throw new Error("Invalid local URL");

    const key = env.SUPABASE_PUBLISHABLE_KEY;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
      const parts = key.split(".");
      if (parts.length !== 3 || JSON.parse(Buffer.from(parts[1], "base64url").toString()).role !== "anon") {
        throw new Error("Invalid public key");
      }
    }
  } catch {
    return {
      status: "configuration-error",
      message: "Configuração inválida: use a URL local http://127.0.0.1:54321 e a chave Publishable ou anon da CLI Supabase. Nunca use chaves administrativas.",
    };
  }
  try {
    const responses = await Promise.all(["/auth/v1/health", "/rest/v1/"].map(async (path) => {
      const response = await fetch(new URL(path, env.SUPABASE_URL), {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY!, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("Service unavailable");
      return response.json();
    }));
    const [auth, api] = responses;
    if (auth.name !== "GoTrue" || api.swagger !== "2.0" || !api.paths) {
      throw new Error("Unexpected service response");
    }
    return {
      status: "connected",
      message: "Conexão local verificada: Auth e API do PostgreSQL respondem pelo servidor.",
    };
  } catch {
    return {
      status: "unavailable",
      message: "Supabase local indisponível ou chave recusada. Verifique Docker, execute npm run supabase:start e confira a chave com npm run supabase:status.",
    };
  }
}
