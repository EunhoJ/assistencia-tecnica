"use server";

import { updateTag } from "next/cache";

import {
  fieldsFromZod,
  gravarIdempotencia,
  verificarIdempotencia,
} from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import { normalizarTelefone } from "@/lib/format/telefone";
import {
  editarOsSchema,
  type EditarOsInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de edição de campos descritivos (FR-3 / Story 2.5). Espelha o
// pattern de `criar-os.action.ts`, mas ATUALIZA dois registros existentes
// (Cliente + Os) em vez de criar. Notas:
//
//   1. Objeto COMPLETO (não diff parcial) — sempre atualiza Cliente e Os com
//      o conjunto enviado. App single-user; no-op seguro quando nada mudou.
//
//   2. Edita o CLIENTE COMPARTILHADO em lugar (não cria novo). Como o Cliente
//      pode ser usado por várias OSs, mudar nome/telefone reflete em TODAS as
//      OSs dele (comportamento de FR-3). `telefone_normalizado` é recalculado
//      para o autocomplete (1.6) casar pelo novo número.
//
//   3. NÃO toca status/pagamento/criadoEm/numeroSequencial; não passa por
//      `alterarStatus` (não muda status).
//
//   4. Sem CONFLITO de telefone — o projeto aceita Clientes duplicados
//      (Open Q9; sem @@unique). Nenhuma unicidade a violar ao editar.
//
//   5. Tag "cliente" diferido — o único consumidor (autocomplete) lê ao vivo
//      via $queryRaw. `updateTag("os")` cobre detalhe e dashboard.

export async function editarOs(
  input: EditarOsInputForm,
): Promise<ActionResult<{ numero: number }>> {
  const parsed = editarOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const result = await db.$transaction(async (tx) => {
    const visto = await verificarIdempotencia<{ numero: number }>(
      tx,
      parsed.data.requestId,
    );
    if (visto) {
      return { ok: true as const, data: visto };
    }

    const os = await tx.os.findUnique({
      where: { numeroSequencial: parsed.data.numero },
      select: { id: true, clienteId: true },
    });

    if (!os) {
      return {
        ok: false as const,
        error: { code: "NAO_ENCONTRADO" as const, entidade: "OS" },
      };
    }

    // Atualiza o registro do Cliente existente (compartilhado).
    await tx.cliente.update({
      where: { id: os.clienteId },
      data: {
        nome: parsed.data.cliente.nome,
        telefone: parsed.data.cliente.telefone,
        telefoneNormalizado: normalizarTelefone(parsed.data.cliente.telefone),
      },
    });

    // Atualiza só os campos descritivos da OS.
    await tx.os.update({
      where: { id: os.id },
      data: {
        aparelhoTipo: parsed.data.aparelho.tipo,
        aparelhoDescricao: parsed.data.aparelho.descricao || null,
        defeitoRelatado: parsed.data.defeitoRelatado,
        observacoes: parsed.data.observacoes || null,
      },
    });

    await gravarIdempotencia(tx, parsed.data.requestId, "editarOs", {
      numero: parsed.data.numero,
    });

    return { ok: true as const, data: { numero: parsed.data.numero } };
  });

  if (result.ok) {
    updateTag("os");
  }
  return result;
}
