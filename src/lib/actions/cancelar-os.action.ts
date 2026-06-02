"use server";

import { updateTag } from "next/cache";

import {
  fieldsFromZod,
  gravarIdempotencia,
  verificarIdempotencia,
} from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import { alterarStatus } from "@/lib/db/transitions";
import { ehAtivo, type StatusOs } from "@/lib/domain/status";
import {
  cancelarOsSchema,
  type CancelarOsInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de terminação `Cancelado` (FR-8 / Story 2.3). Cliente desistiu.
// Espelha o pattern de `avancar-status.action.ts` / `marcar-aprovado.action.ts`,
// com três notas:
//
//   1. PASSA por `alterarStatus` — muda o Status (Regra Inegociável 4). Atualiza
//      `status` + `statusAlteradoEm` atomicamente. Nunca `tx.os.update` direto.
//
//   2. Gate é `ehAtivo(status)` — só uma OS em andamento pode ser cancelada.
//      Defesa em profundidade: a UI já esconde o botão em terminal, mas o
//      servidor é a autoridade. OS já terminal → CONFLITO.
//
//   3. Idempotência com shape `{ status }` (string literal) — sem a pegadinha
//      de Date serializado que `marcarAprovado` tem.
//
// É a action-irmã de `sem-solucao-os.action.ts` (FR-9): estrutura idêntica,
// difere só no Status terminal e na mensagem. Duplicação intencional —
// architecture lista os dois arquivos separados; YAGNI até um 3º terminal.

export async function cancelarOs(
  input: CancelarOsInputForm,
): Promise<ActionResult<{ status: StatusOs }>> {
  const parsed = cancelarOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const result = await db.$transaction(async (tx) => {
    const visto = await verificarIdempotencia<{ status: StatusOs }>(
      tx,
      parsed.data.requestId,
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

    if (!ehAtivo(os.status as StatusOs)) {
      return {
        ok: false as const,
        error: {
          code: "CONFLITO" as const,
          mensagem: "Só é possível cancelar uma OS em andamento",
        },
      };
    }

    await alterarStatus(tx, os.id, "Cancelado");
    await gravarIdempotencia(tx, parsed.data.requestId, "cancelarOs", {
      status: "Cancelado",
    });

    return { ok: true as const, data: { status: "Cancelado" as StatusOs } };
  });

  if (result.ok) {
    updateTag("os");
  }
  return result;
}
