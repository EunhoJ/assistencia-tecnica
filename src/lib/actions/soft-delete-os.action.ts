"use server";

import { updateTag } from "next/cache";

import {
  fieldsFromZod,
  gravarIdempotencia,
  verificarIdempotencia,
} from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import { ehTerminal, type StatusOs } from "@/lib/domain/status";
import { log } from "@/lib/log";
import {
  softDeleteOsSchema,
  type SoftDeleteOsInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de soft-delete (FR-4 / Story 2.6). Marca `deletadoEm = now()`.
// Notas:
//
//   1. Usa `db` (com extension de soft-delete). A extension intercepta apenas
//      READS — `update` grava `deletadoEm` normalmente. O lookup prévio com
//      `db.os.findUnique` retorna null se a OS JÁ está deletada (não se pode
//      re-deletar). NÃO passa por `alterarStatus` (não muda `status`).
//
//   2. Gate de confirmação: Status terminal exige `confirmado: true` (a UI
//      mostra um Dialog enumerando impactos antes). Status ativo dispensa
//      (a UI oferece undo via toast).

export async function softDeleteOs(
  input: SoftDeleteOsInputForm,
): Promise<ActionResult<{ numero: number }>> {
  const parsed = softDeleteOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const visto = await verificarIdempotencia<{ numero: number }>(
        tx,
        parsed.data.requestId,
        "softDeleteOs",
      );
      if (visto) {
        return { ok: true as const, data: visto };
      }

      const os = await tx.os.findUnique({
        where: { numeroSequencial: parsed.data.numero },
        select: { id: true, status: true },
      });

      if (!os) {
        return {
          ok: false as const,
          error: { code: "NAO_ENCONTRADO" as const, entidade: "OS" },
        };
      }

      if (ehTerminal(os.status as StatusOs) && !parsed.data.confirmado) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "Deleção de terminal exige confirmação",
          },
        };
      }

      await tx.os.update({
        where: { id: os.id },
        data: { deletadoEm: new Date() },
      });

      await gravarIdempotencia(tx, parsed.data.requestId, "softDeleteOs", {
        numero: parsed.data.numero,
      });

      return { ok: true as const, data: { numero: parsed.data.numero } };
    });

    if (result.ok) {
      updateTag("os");
    }
    return result;
  } catch (erro) {
    log.error("softDeleteOs.erro", erro, { numero: parsed.data.numero });
    return {
      ok: false,
      error: { code: "INTERNO", mensagem: "Erro interno ao processar a operação" },
    };
  }
}
