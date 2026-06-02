"use server";

import { updateTag } from "next/cache";

import { fieldsFromZod } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { dbBase } from "@/lib/db/client";
// Colisão de nome: o WRAPPER `restaurarOs(db, id)` (Story 1.3) vs esta ACTION
// `restaurarOs({ numero })`. Importar o wrapper com alias.
import { restaurarOs as restaurarOsDb } from "@/lib/db/extensions";
import {
  restaurarOsSchema,
  type RestaurarOsInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de restaurar (FR-4 / Story 2.6). Usa `dbBase` (cru) — a OS
// deletada está oculta para `db` (extension de soft-delete). Sem
// `$transaction` (operação única) e sem idempotência por requestId (restaurar
// é naturalmente idempotente; o passo "já ativa" cobre).

export async function restaurarOs(
  input: RestaurarOsInputForm,
): Promise<ActionResult<{ numero: number }>> {
  const parsed = restaurarOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const os = await dbBase.os.findUnique({
    where: { numeroSequencial: parsed.data.numero },
    select: { id: true, deletadoEm: true },
  });

  if (!os) {
    return {
      ok: false,
      error: { code: "NAO_ENCONTRADO", entidade: "OS" },
    };
  }

  // Idempotência por estado: já ativa → no-op.
  if (os.deletadoEm === null) {
    return { ok: true, data: { numero: parsed.data.numero } };
  }

  await restaurarOsDb(dbBase, os.id);
  updateTag("os");
  return { ok: true, data: { numero: parsed.data.numero } };
}
