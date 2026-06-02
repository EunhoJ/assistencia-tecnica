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
  semSolucaoSchema,
  type SemSolucaoInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de terminação `Sem_solucao` (FR-9 / Story 2.3). Desistência
// técnica — distinta de `Cancelado` (decisão do cliente) e de `Entregue`
// (consertado). Action-irmã de `cancelar-os.action.ts`: estrutura idêntica,
// difere só no Status terminal e na mensagem. Mesmas três notas:
//
//   1. PASSA por `alterarStatus` — muda o Status (Regra Inegociável 4).
//   2. Gate é `ehAtivo(status)` — OS já terminal → CONFLITO (servidor é a
//      autoridade; a UI já esconde o botão).
//   3. Idempotência com shape `{ status }` (string) — sem pegadinha de Date.
//
// Duplicação intencional com `cancelarOs` — architecture lista os dois
// arquivos separados; YAGNI até um 3º terminal-action surgir.

export async function semSolucaoOs(
  input: SemSolucaoInputForm,
): Promise<ActionResult<{ status: StatusOs }>> {
  const parsed = semSolucaoSchema.safeParse(input);
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
          mensagem: "Só é possível marcar 'Sem solução' numa OS em andamento",
        },
      };
    }

    await alterarStatus(tx, os.id, "Sem_solucao");
    await gravarIdempotencia(tx, parsed.data.requestId, "semSolucaoOs", {
      status: "Sem_solucao",
    });

    return { ok: true as const, data: { status: "Sem_solucao" as StatusOs } };
  });

  if (result.ok) {
    updateTag("os");
  }
  return result;
}
