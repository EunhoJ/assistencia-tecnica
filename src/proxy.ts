import { NextResponse, type NextRequest } from "next/server";

import {
  compareTokenConstantTime,
  extrairTokenDoPath,
  hashIp,
} from "@/lib/auth/token";
import { log, redactPath } from "@/lib/log";
import { verificarRateLimit } from "@/lib/ratelimit";

// Fail-fast no boot: deploy quebra ANTES de servir tráfego se ACCESS_TOKEN
// não estiver configurado. Preferível a silenciosamente liberar tudo.
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  throw new Error("ACCESS_TOKEN não configurado");
}

function pegarIpDoRequest(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const primeiro = xff.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  const real = request.headers.get("x-real-ip");
  return real ?? "unknown";
}

function responder404(): Response {
  return new Response("Not Found", { status: 404 });
}

export async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ipHash = hashIp(pegarIpDoRequest(request));

  const tokenDoPath = extrairTokenDoPath(pathname);

  if (!tokenDoPath || !compareTokenConstantTime(tokenDoPath, ACCESS_TOKEN!)) {
    log.event("proxy.deny.token", {
      ip_hash: ipHash,
      method,
      path_redacted: redactPath(pathname, tokenDoPath),
    });
    return responder404();
  }

  const pathRedacted = redactPath(pathname, tokenDoPath);

  const rl = await verificarRateLimit(`proxy:${ipHash}`);
  if (!rl.ok) {
    log.event("proxy.deny.ratelimit", {
      ip_hash: ipHash,
      method,
      path_redacted: pathRedacted,
      retry_after_s: rl.retryAfterS,
    });
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterS ?? 60) },
    });
  }

  log.event("proxy.allow", {
    ip_hash: ipHash,
    method,
    path_redacted: pathRedacted,
  });

  return NextResponse.next();
}

// Cobre tudo exceto recursos estáticos/metadados que o Next serve direto.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|manifest.webmanifest|icon-.*\\.png).*)",
  ],
};
