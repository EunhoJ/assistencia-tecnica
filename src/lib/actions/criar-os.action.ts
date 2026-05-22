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
import { criarOsSchema, type CriarOsInputForm } from "@/lib/schemas/os.schema";

// Primeira Server Action do projeto. Pattern canônico que todas as actions
// de mutação subsequentes (Stories 2.x) devem seguir:
//
//   1. safeParse(input) → ActionResult ok=false em falha de validação
//   2. Tudo em $transaction
//      a. verificarIdempotencia(tx, requestId) → curto-circuita se já visto
//      b. Mutação(ões) Prisma
//      c. gravarIdempotencia(tx, ...) para selar o requestId
//   3. revalidateTag fora da transação
//   4. Retornar ActionResult ok=true
//
// NÃO chamar `redirect()` aqui — issue conhecido do Next 16 + perde o
// shape ActionResult. O caller (client) faz router.push após ver result.ok.

export async function criarOs(
  input: CriarOsInputForm,
): Promise<ActionResult<{ numero: number }>> {
  const parsed = criarOsSchema.safeParse(input);
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

    const telefoneNormalizado = normalizarTelefone(parsed.data.cliente.telefone);

    // Story 1.6: curto-circuito por clienteIdSelecionado (autocomplete).
    // Se válido E não soft-deleted (extension filtra em findUnique),
    // reusa o Cliente sem criar duplicata.
    let cliente: Awaited<ReturnType<typeof tx.cliente.findUnique>> = null;
    if (parsed.data.clienteIdSelecionado) {
      cliente = await tx.cliente.findUnique({
        where: { id: BigInt(parsed.data.clienteIdSelecionado) },
      });
      // Se null (Cliente soft-deleted entre seleção e submit, ou id inválido),
      // cai no fallback findFirst+create abaixo — defesa silenciosa.
    }

    // Fallback: upsert manual de Cliente quando não houve seleção ou seleção
    // perdeu validade. Schema não tem @@unique em (nome, telefone_normalizado)
    // (Open Q9 do PRD aceita duplicatas em v1). Race condition em chamadas
    // simultâneas é tolerada — single-user.
    if (!cliente) {
      cliente = await tx.cliente.findFirst({
        where: {
          nome: parsed.data.cliente.nome,
          telefoneNormalizado,
        },
      });
    }
    if (!cliente) {
      cliente = await tx.cliente.create({
        data: {
          nome: parsed.data.cliente.nome,
          telefone: parsed.data.cliente.telefone,
          telefoneNormalizado,
        },
      });
    }

    const criada = await tx.os.create({
      data: {
        clienteId: cliente.id,
        aparelhoTipo: parsed.data.aparelho.tipo,
        aparelhoDescricao: parsed.data.aparelho.descricao || null,
        defeitoRelatado: parsed.data.defeitoRelatado,
        status: "Recebido",
        statusAlteradoEm: new Date(),
        requestId: parsed.data.requestId,
      },
    });

    await gravarIdempotencia(tx, parsed.data.requestId, "criarOs", {
      numero: criada.numeroSequencial,
    });

    return { ok: true as const, data: { numero: criada.numeroSequencial } };
  });

  // Next 16: updateTag em vez de revalidateTag em Server Actions
  // ("read-your-own-writes" — query subsequente vê o dado novo imediatamente).
  updateTag("os");
  return result;
}
