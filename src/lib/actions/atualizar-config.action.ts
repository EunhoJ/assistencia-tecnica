"use server";

import { updateTag } from "next/cache";

import {
  fieldsFromZod,
  gravarIdempotencia,
  verificarIdempotencia,
} from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import {
  atualizarConfigSchema,
  type AtualizarConfigInputForm,
} from "@/lib/schemas/config.schema";

// Server Action de atualização do Limiar (FR-18 / Story 3.1). Usa `upsert`
// (não `update`): o seed (Story 1.3) só roda em dev, então a linha
// `Config { id: 1 }` pode não existir em produção — `update` lançaria.
// `upsert` cria-ou-atualiza, robusto em qualquer ambiente.
//
// Tags `config`/`aparelhos-parados` são forward-compat (hoje sem consumidor;
// o relatório de Aparelhos parados — Story 3.3 — vai consumi-los).

export async function atualizarConfig(
  input: AtualizarConfigInputForm,
): Promise<ActionResult<{ limiarDiasParados: number }>> {
  const parsed = atualizarConfigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const result = await db.$transaction(async (tx) => {
    const visto = await verificarIdempotencia<{ limiarDiasParados: number }>(
      tx,
      parsed.data.requestId,
    );
    if (visto) {
      return { ok: true as const, data: visto };
    }

    const atualizada = await tx.config.upsert({
      where: { id: 1 },
      create: { id: 1, limiarDiasParados: parsed.data.limiarDiasParados },
      update: { limiarDiasParados: parsed.data.limiarDiasParados },
      select: { limiarDiasParados: true },
    });

    await gravarIdempotencia(tx, parsed.data.requestId, "atualizarConfig", {
      limiarDiasParados: atualizada.limiarDiasParados,
    });

    return {
      ok: true as const,
      data: { limiarDiasParados: atualizada.limiarDiasParados },
    };
  });

  if (result.ok) {
    updateTag("config");
    updateTag("aparelhos-parados");
  }
  return result;
}
