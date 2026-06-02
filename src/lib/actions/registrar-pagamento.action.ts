"use server";

import { updateTag } from "next/cache";

import {
  fieldsFromZod,
  gravarIdempotencia,
  verificarIdempotencia,
} from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import type { EstadoPagamento } from "@/lib/domain/pagamento";
import {
  registrarPagamentoSchema,
  type RegistrarPagamentoInputForm,
} from "@/lib/schemas/pagamento.schema";

// Server Action de Pagamento (FR-10 / Story 2.4). Espelha o pattern de
// `marcar-aprovado.action.ts`: muta colunas adjacentes via `tx.os.update`
// direto — NÃO passa por `alterarStatus`, porque pagamento é uma dimensão
// ORTOGONAL ao Status (decisão do PRD). O grep da Regra Inegociável 4
// continua mostrando `alterarStatus` só em avancar/cancelar/sem-solucao.
//
// Notas:
//   1. Sem gate de status — pagamento é permitido em qualquer Status (ativo
//      ou terminal). Ex.: marcar Pago numa OS Cancelado é válido.
//   2. `pago_em` só é escrito na PRIMEIRA vez que o estado vira Pago; nunca é
//      sobrescrito nem limpo (Open Q v1: timestamp não editável). Sair de Pago
//      preserva o `pago_em` histórico.
//   3. Idempotência: `pagoEm` (Date|null) serializa como ISO string|null em
//      payloadRespostaJson (Json) — generic reflete `string | null`; conversão
//      `new Date(...)` no replay (pegadinha herdada da Story 2.2).
//   4. Tag "pagamento" diferido — nenhuma query consome esse tag hoje; o
//      detalhe e o dashboard invalidam por "os". `updateTag("os")` basta.

export async function registrarPagamento(
  input: RegistrarPagamentoInputForm,
): Promise<ActionResult<{ estado: EstadoPagamento; pagoEm: Date | null }>> {
  const parsed = registrarPagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const result = await db.$transaction(async (tx) => {
    const visto = await verificarIdempotencia<{
      estado: EstadoPagamento;
      pagoEm: string | null;
    }>(tx, parsed.data.requestId);
    if (visto) {
      return {
        ok: true as const,
        data: {
          estado: visto.estado,
          pagoEm: visto.pagoEm ? new Date(visto.pagoEm) : null,
        },
      };
    }

    const os = await tx.os.findUnique({
      where: { numeroSequencial: parsed.data.numero },
      select: { id: true, pagoEm: true },
    });

    if (!os) {
      return {
        ok: false as const,
        error: { code: "NAO_ENCONTRADO" as const, entidade: "OS" },
      };
    }

    // `pago_em` só é preenchido na primeira vez que vira Pago. Nunca limpa,
    // nunca sobrescreve um timestamp existente.
    const preencherPagoEm =
      parsed.data.estadoPagamento === "Pago" && os.pagoEm === null;

    // Forma só faz sentido quando Pago — limpar nos demais estados.
    const forma =
      parsed.data.estadoPagamento === "Pago" ? parsed.data.formaPagamento : null;

    const atualizada = await tx.os.update({
      where: { id: os.id },
      data: {
        valorCobradoCentavos: parsed.data.valorCobradoCentavos,
        estadoPagamento: parsed.data.estadoPagamento,
        formaPagamento: forma,
        ...(preencherPagoEm ? { pagoEm: new Date() } : {}),
      },
      select: { estadoPagamento: true, pagoEm: true },
    });

    await gravarIdempotencia(tx, parsed.data.requestId, "registrarPagamento", {
      estado: atualizada.estadoPagamento,
      pagoEm: atualizada.pagoEm ? atualizada.pagoEm.toISOString() : null,
    });

    return {
      ok: true as const,
      data: {
        estado: atualizada.estadoPagamento as EstadoPagamento,
        pagoEm: atualizada.pagoEm,
      },
    };
  });

  if (result.ok) {
    updateTag("os");
  }
  return result;
}
