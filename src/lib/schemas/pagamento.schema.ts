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
    valorCobradoCentavos: z.number().int().nonnegative().nullable(),
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
  });

export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>;
export type RegistrarPagamentoInputForm = z.input<
  typeof registrarPagamentoSchema
>;
