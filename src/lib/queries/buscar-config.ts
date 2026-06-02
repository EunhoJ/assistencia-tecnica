import { LIMIAR_DIAS_PARADOS_DEFAULT } from "@/lib/constants";
import { db } from "@/lib/db/client";

// Lê o singleton `Config { id: 1 }` (FR-18 / Story 3.1). O modelo Config NÃO
// está na extension de soft-delete (só Os/Cliente) — `db` é seguro.
//
// Fallback prod-safe: o seed (Story 1.3) só roda em dev, então a linha pode
// não existir em produção. Retorna o default nesse caso (a action faz upsert
// na primeira gravação).

export async function buscarConfig(): Promise<{ limiarDiasParados: number }> {
  const config = await db.config.findUnique({
    where: { id: 1 },
    select: { limiarDiasParados: true },
  });
  return { limiarDiasParados: config?.limiarDiasParados ?? LIMIAR_DIAS_PARADOS_DEFAULT };
}
