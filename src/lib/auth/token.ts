import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";

// Comparação em tempo constante. Se os tamanhos diferem, faz uma comparação
// dummy contra o próprio buffer esperado para preservar tempo aproximadamente
// constante e evita o RangeError de timingSafeEqual em tamanhos diferentes.
export function compareTokenConstantTime(
  provided: string,
  expected: string,
): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

// Extrai o primeiro segment não-vazio do pathname. '/' → null; '/abc/foo' → 'abc'.
export function extrairTokenDoPath(pathname: string): string | null {
  const segments = pathname.split("/").filter((s) => s.length > 0);
  return segments[0] ?? null;
}

// Hash SHA-256 truncado a 16 hex chars (~64 bits) do IP. Suficiente para
// distinguir clientes em uso single-user; evita PII bruta em logs e chaves
// do Redis.
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
