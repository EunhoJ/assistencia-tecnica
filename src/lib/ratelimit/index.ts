import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_S } from "@/lib/constants";

// Único consumidor do Upstash no projeto inteiro. Server Actions e queries
// futuras não devem instanciar Redis nem Ratelimit — chamar `verificarRateLimit`.

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    RATE_LIMIT_REQUESTS,
    `${RATE_LIMIT_WINDOW_S} s`,
  ),
  analytics: false,
  prefix: "rl",
});

export type RateLimitResultado = {
  ok: boolean;
  retryAfterS: number | null;
};

export async function verificarRateLimit(
  identificador: string,
): Promise<RateLimitResultado> {
  const { success, reset } = await ratelimit.limit(identificador);
  if (success) {
    return { ok: true, retryAfterS: null };
  }
  const retryAfterS = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return { ok: false, retryAfterS };
}
