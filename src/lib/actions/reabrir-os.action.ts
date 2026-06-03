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
import {
  resolverHistoricoPagamento,
  type DecisaoPagamento,
} from "@/lib/domain/pagamento";
import { ehTerminal, podeReabrirPara, type StatusOs } from "@/lib/domain/status";
import { log } from "@/lib/log";
import {
  reabrirOsSchema,
  type ReabrirOsInputForm,
} from "@/lib/schemas/os.schema";

// Server Action de reabertura (FR-19 / Story 2.7). 4º caller de `alterarStatus`
// (terminal → ativo). Combina, numa única transação, a mudança de Status (via
// `alterarStatus` — Regra Inegociável 4) com o ajuste da dimensão de pagamento
// (via `tx.os.update` direto, só quando a OS tinha pagamento concretizado).
//
//   - NÃO reseta `aprovadoEm` (a 2.2 garante: a aprovação histórica vale na
//     reabertura — o pai não re-aprova).
//   - Idempotência com payload `{ paraStatus, decisaoPagamento }` (só strings;
//     sem pegadinha de Date). `novoPagoEm` (Date|null) vai só para o update.
//   - ActionLog usa "reabrirOs" (camelCase, consistente com as demais actions).

export async function reabrirOs(
  input: ReabrirOsInputForm,
): Promise<
  ActionResult<{ paraStatus: StatusOs; decisaoPagamento: DecisaoPagamento | null }>
> {
  const parsed = reabrirOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const visto = await verificarIdempotencia<{
        paraStatus: StatusOs;
        decisaoPagamento: DecisaoPagamento | null;
      }>(tx, parsed.data.requestId, "reabrirOs");
      if (visto) {
        return { ok: true as const, data: visto };
      }

      const os = await tx.os.findUnique({
        where: { numeroSequencial: parsed.data.numero },
        select: { id: true, status: true, estadoPagamento: true, pagoEm: true },
      });

      if (!os) {
        return {
          ok: false as const,
          error: { code: "NAO_ENCONTRADO" as const, entidade: "OS" },
        };
      }

      const statusAtual = os.status as StatusOs;

      if (!ehTerminal(statusAtual)) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "OS não está em status terminal",
          },
        };
      }

      if (!podeReabrirPara(statusAtual, parsed.data.paraStatus)) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "Destino de reabertura inválido",
          },
        };
      }

      const tinhaPago = os.estadoPagamento === "Pago" && os.pagoEm !== null;
      if (tinhaPago && !parsed.data.decisaoPagamento) {
        return {
          ok: false as const,
          error: {
            code: "VALIDACAO" as const,
            campos: { decisaoPagamento: "obrigatória" },
          },
        };
      }

      await alterarStatus(tx, os.id, parsed.data.paraStatus);

      if (tinhaPago && parsed.data.decisaoPagamento) {
        const { novoEstado, novoPagoEm } = resolverHistoricoPagamento(
          { pagoEm: os.pagoEm },
          parsed.data.decisaoPagamento,
        );
        await tx.os.update({
          where: { id: os.id },
          data: {
            estadoPagamento: novoEstado,
            pagoEm: novoPagoEm,
            // Reverter limpa a forma; manter não toca.
            ...(novoEstado === "Pago" ? {} : { formaPagamento: null }),
          },
        });
      }

      await gravarIdempotencia(tx, parsed.data.requestId, "reabrirOs", {
        paraStatus: parsed.data.paraStatus,
        decisaoPagamento: parsed.data.decisaoPagamento ?? null,
      });

      return {
        ok: true as const,
        data: {
          paraStatus: parsed.data.paraStatus,
          decisaoPagamento: parsed.data.decisaoPagamento ?? null,
        },
      };
    });

    if (result.ok) {
      updateTag("os");
    }
    return result;
  } catch (erro) {
    log.error("reabrirOs.erro", erro, { numero: parsed.data.numero });
    return {
      ok: false,
      error: { code: "INTERNO", mensagem: "Erro interno ao processar a operação" },
    };
  }
}
