import "server-only";
import { cookies } from "next/headers";
import { createRequestClient } from "./identity.ts";

// Server Actions/Route Handlers podem persistir cookies; Server Components
// leem a sessão já renovada pelo proxy.
export async function createSessionClient() {
  const store = await cookies();
  return createRequestClient({
    getAll: () => store.getAll(),
    setAll: (values) => {
      try { for (const { name, value, options } of values) store.set(name, value, options); }
      catch { /* Server Component: o proxy persiste a renovação. */ }
    },
  });
}
