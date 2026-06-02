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
  marcarAprovadoSchema,
  type MarcarAprovadoInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de marcar aprovação do orçamento (FR-7 / Story 2.2).
// Espelha o pattern de `avancar-status.action.ts`, com duas diferenças:
//
//   1. NÃO passa por `alterarStatus` — esta action só preenche `aprovadoEm`,
//      não muda `status`. `alterarStatus` é exclusivo de mudança de Status
//      + `statusAlteradoEm` (regra inegociável 4).
//
//   2. `aprovado_em` uma vez preenchido NUNCA é zerado pelo fluxo normal.
//      Reabrir uma OS (Story 2.7) preserva a aprovação histórica — o pai
//      não precisa re-aprovar. Só SQL manual reseta em caso excepcional.
//
// Validações:
//   - status atual deve ser "Orcamento" (CONFLITO caso contrário).
//   - se `aprovadoEm` já preenchido, retorna sucesso silencioso (idempotência
//     implícita por estado — double-click em sessões/abas diferentes com
//     requestIds distintos ainda é seguro).

export async function marcarAprovado(
  input: MarcarAprovadoInputForm,
): Promise<ActionResult<{ aprovadoEm: Date }>> {
  const parsed = marcarAprovadoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const result = await db.$transaction(async (tx) => {
    // payloadRespostaJson é Json no Prisma — Date é serializado como string
    // ISO. Generic precisa refletir isso (string, não Date).
    const visto = await verificarIdempotencia<{ aprovadoEm: string }>(
      tx,
      parsed.data.requestId,
    );
    if (visto) {
      return {
        ok: true as const,
        data: { aprovadoEm: new Date(visto.aprovadoEm) },
      };
    }

    const os = await tx.os.findUnique({
      where: { numeroSequencial: parsed.data.numero },
      select: { id: true, status: true, aprovadoEm: true },
    });

    if (!os) {
      return {
        ok: false as const,
        error: { code: "NAO_ENCONTRADO" as const, entidade: "OS" },
      };
    }

    if (os.status !== "Orcamento") {
      return {
        ok: false as const,
        error: {
          code: "CONFLITO" as const,
          mensagem: "Aprovação só pode ser marcada quando o Status é Orçamento",
        },
      };
    }

    // Idempotência implícita por estado: já aprovado → retorna sucesso sem
    // mutar. Preserva o timestamp histórico (não sobrescreve com new Date()).
    if (os.aprovadoEm !== null) {
      return {
        ok: true as const,
        data: { aprovadoEm: os.aprovadoEm },
      };
    }

    const atualizada = await tx.os.update({
      where: { id: os.id },
      data: { aprovadoEm: new Date() },
      select: { aprovadoEm: true },
    });

    await gravarIdempotencia(tx, parsed.data.requestId, "marcarAprovado", {
      aprovadoEm: atualizada.aprovadoEm!.toISOString(),
    });

    return {
      ok: true as const,
      data: { aprovadoEm: atualizada.aprovadoEm! },
    };
  });

  if (result.ok) {
    updateTag("os");
  }
  return result;
}
