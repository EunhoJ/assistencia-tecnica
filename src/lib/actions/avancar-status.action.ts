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
  ehTransicaoNaoNatural,
  exigeAprovacao,
  podeTransicionar,
  type StatusOs,
} from "@/lib/domain/status";
import { log } from "@/lib/log";
import {
  avancarStatusSchema,
  type AvancarStatusInputForm,
} from "@/lib/schemas/os.schema";

// Server Action canônica para FR-6 (Avançar Status). Pattern espelha
// `criar-os.action.ts`:
//
//   1. safeParse(input) → ActionResult ok=false em falha de validação
//   2. Tudo em $transaction (uma idempotência + lookup + validação + mutação)
//      a. verificarIdempotencia(tx, requestId) → curto-circuita se já visto
//      b. lookup OS por numeroSequencial (extension soft-delete ativa)
//      c. validação de domínio: podeTransicionar; transição não-natural
//         exige `confirmado: true`; FR-7 delegado a `exigeAprovacao` em
//         domain (Story 2.2 — agora compartilhado com `marcarAprovado`)
//      d. alterarStatus(tx, ...) — helper transacional ÚNICO
//      e. gravarIdempotencia(tx, ...)
//   3. updateTag("os") fora da transação (read-your-own-writes Next 16)
//   4. Retornar ActionResult ok=true

export async function avancarStatus(
  input: AvancarStatusInputForm,
): Promise<ActionResult<{ status: StatusOs }>> {
  const parsed = avancarStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const visto = await verificarIdempotencia<{ status: StatusOs }>(
        tx,
        parsed.data.requestId,
        "avancarStatus",
      );
      if (visto) {
        return { ok: true as const, data: visto };
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

      const statusAtual = os.status as StatusOs;
      const paraStatus = parsed.data.paraStatus;

      if (!podeTransicionar(statusAtual, paraStatus)) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "Transição inválida",
          },
        };
      }

      if (
        ehTransicaoNaoNatural(statusAtual, paraStatus) &&
        !parsed.data.confirmado
      ) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "Transição não-natural exige confirmação",
          },
        };
      }

      // FR-7: regra centralizada em domain (Story 2.2). A mensagem é
      // observável pelo `<BotaoAvancarStatus />` (mostra inline) e pela UAT;
      // não alterar o texto sem revisar callsites.
      if (exigeAprovacao(statusAtual, paraStatus) && os.aprovadoEm === null) {
        return {
          ok: false as const,
          error: {
            code: "CONFLITO" as const,
            mensagem: "Aprovação do orçamento é pré-requisito",
          },
        };
      }

      await alterarStatus(tx, os.id, paraStatus);
      await gravarIdempotencia(tx, parsed.data.requestId, "avancarStatus", {
        status: paraStatus,
      });

      return { ok: true as const, data: { status: paraStatus } };
    });

    // updateTag fora da transação — read-your-own-writes Next 16. Só
    // invalidar quando a mutação efetivamente ocorreu (ok === true).
    if (result.ok) {
      updateTag("os");
    }
    return result;
  } catch (erro) {
    log.error("avancarStatus.erro", erro, { numero: parsed.data.numero });
    return {
      ok: false,
      error: { code: "INTERNO", mensagem: "Erro interno ao processar a operação" },
    };
  }
}
