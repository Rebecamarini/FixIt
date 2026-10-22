import { NextResponse, type NextRequest } from "next/server";
import { createRequestClient } from "./server/identity.ts";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createRequestClient({
    getAll: () => request.cookies.getAll(),
    setAll: (values, headers) => {
      for (const { name, value } of values) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of values) response.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/", "/conta/:path*", "/solicitacoes/:path*"] };
