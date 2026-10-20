import "server-only";
import { getSupabaseConfig } from "./config.ts";

export type ConnectionStatus = {
  status: "connected" | "configuration-error" | "unavailable";
  message: string;
};

// Interface compartilhada pela página inicial e pelo comando de diagnóstico.
export async function checkConnection(
  env: Record<string, string | undefined> = process.env,
): Promise<ConnectionStatus> {
  let config;
  try {
    config = getSupabaseConfig(env);
  } catch (error) {
    return { status: "configuration-error", message: (error as Error).message };
  }
  try {
    const responses = await Promise.all(["/auth/v1/health", "/rest/v1/__fixit_connection_probe__?select=*", "/storage/v1/bucket"].map(async (path) => {
      const response = await fetch(new URL(path, config.url), {
        headers: { apikey: config.publishableKey, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.json();
      if (path.startsWith("/rest/v1/")) {
        // A resource deliberately absent from the schema verifies PostgREST without exposing OpenAPI.
        if (response.status !== 404 || body.code !== "PGRST205") throw new Error("API unavailable");
      } else if (!response.ok) throw new Error("Service unavailable");
      return body;
    }));
    const [auth, , buckets] = responses;
    if (auth.name !== "GoTrue" || !Array.isArray(buckets)) {
      throw new Error("Unexpected service response");
    }
    return {
      status: "connected",
      message: `Conexão ${config.target} verificada: Auth, PostgREST e Storage respondem pelo servidor.`,
    };
  } catch {
    return {
      status: "unavailable",
      message: config.target === "local"
        ? "Supabase local indisponível ou chave recusada. Verifique Docker, execute npm run supabase:start e confira a chave com npm run supabase:status."
        : "Supabase cloud indisponível ou chave recusada. Confira o estado do projeto e a Publishable key do mesmo ambiente no painel Supabase.",
    };
  }
}
