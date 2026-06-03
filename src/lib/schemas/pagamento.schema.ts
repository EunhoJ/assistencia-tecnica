import { z } from "zod";

import type { EstadoPagamento, FormaPagamento } from "@/lib/domain/pagamento";

// Schema de input para registrar Pagamento (FR-10 / Story 2.4). Usado no
// server (safeParse na action). Espelha o idiom de `STATUS_OS_VALORES` em
// os.schema.ts: tuplas alimentando `z.enum`, importando os literais de domain
// (mantém alinhamento sem importar Prisma).

export const ESTADO_PAGAMENTO_VALORES = [
  "Pago",
  "Pendente",
  "Sem_cobranca",
] as const satisfies readonly [EstadoPagamento, ...EstadoPagamento[]];

export const FORMA_PAGAMENTO_VALORES = [
  "PIX",
  "Dinheiro",
  "Cartao",
] as const satisfies readonly [FormaPagamento, ...FormaPagamento[]];

// Regra cruzada central (FR-10): Forma só é exigida quando Estado = Pago.
// Nos demais estados, formaPagamento é opcional (a action força null).
export const registrarPagamentoSchema = z
  .object({
    numero: z.number().int().positive("número da OS inválido"),
    // Teto = máximo de um INTEGER Postgres (coluna valor_cobrado_centavos).
    // Sem ele, um valor enorme estoura a coluna ou perde precisão (≈ R$ 21M).
    valorCobradoCentavos: z
      .number()
      .int()
      .nonnegative()
      .max(2_147_483_647)
      .nullable(),
    estadoPagamento: z.enum(ESTADO_PAGAMENTO_VALORES),
    formaPagamento: z.enum(FORMA_PAGAMENTO_VALORES).nullable(),
    requestId: z.string().uuid("requestId inválido"),
  })
  .superRefine((val, ctx) => {
    if (val.estadoPagamento === "Pago" && val.formaPagamento === null) {
      ctx.addIssue({
        code: "custom",
        path: ["formaPagamento"],
        message: "Forma de pagamento é obrigatória quando Pago",
      });
    }
    // Pago implica que houve cobrança concretizada — valor > 0 obrigatório
    // (estado "Sem_cobranca" cobre o caso sem valor). Sem isso, uma OS entra
    // como Paga de R$ 0,00 no Resumo financeiro.
    if (
      val.estadoPagamento === "Pago" &&
      (val.valorCobradoCentavos === null || val.valorCobradoCentavos <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["valorCobradoCentavos"],
        message: "Valor cobrado é obrigatório quando Pago",
      });
    }
  });

export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>;
export type RegistrarPagamentoInputForm = z.input<
  typeof registrarPagamentoSchema
>;
