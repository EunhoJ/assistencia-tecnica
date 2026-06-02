import { z } from "zod";

import type { StatusOs } from "@/lib/domain/status";

import { clienteInlineSchema } from "./cliente.schema";

// Schema de input para criar OS (FR-1). Usado tanto no client (RHF
// resolver) quanto no server (safeParse na action). `requestId` é
// validado só no server — o client não tem campo para isso; é injetado
// pelo form a partir de `crypto.randomUUID()` antes do submit.

export const criarOsSchema = z.object({
  cliente: clienteInlineSchema,
  aparelho: z.object({
    tipo: z.string().min(1, "Tipo do aparelho é obrigatório"),
    descricao: z.string().default(""),
  }),
  defeitoRelatado: z.string().min(1, "Defeito é obrigatório"),
  requestId: z.string().uuid("requestId inválido"),
  // Cliente selecionado via autocomplete (Story 1.6). String porque o id
  // do Cliente é BigInt no DB e não serializa direto via Server Action.
  // Opcional: form pode submeter sem ter selecionado (Cliente novo).
  clienteIdSelecionado: z
    .string()
    .regex(/^\d+$/, "clienteIdSelecionado deve ser numérico")
    .optional(),
});

// Output (após .default() aplicar): descricao é string. Use em código pós-parse.
export type CriarOsInput = z.infer<typeof criarOsSchema>;

// Input (antes do safeParse): descricao é opcional. Use no contrato da Server
// Action e no tipo do form RHF (que precisa casar com o input do resolver).
export type CriarOsInputForm = z.input<typeof criarOsSchema>;

// ============================================================================
// Avançar Status (Story 2.1 / FR-6)
// ============================================================================

// Tupla com os 7 valores do enum status_os_enum (mesma ordem do schema Prisma)
// para alimentar `z.enum`. Importar o type `StatusOs` de domain mantém o
// schema alinhado ao domain literal sem importar Prisma.
export const STATUS_OS_VALORES = [
  "Recebido",
  "Orcamento",
  "Aguardando_peca",
  "Consertado",
  "Entregue",
  "Cancelado",
  "Sem_solucao",
] as const satisfies readonly [StatusOs, ...StatusOs[]];

export const avancarStatusSchema = z.object({
  numero: z.number().int().positive("número da OS inválido"),
  paraStatus: z.enum(STATUS_OS_VALORES),
  requestId: z.string().uuid("requestId inválido"),
  // Confirmação para transições não-naturais. O client envia true após o
  // operador confirmar via Dialog. Default false (omitido) — primeira
  // chamada de transição não-natural recebe CONFLITO pedindo confirmação.
  confirmado: z.boolean().optional().default(false),
});

export type AvancarStatusInput = z.infer<typeof avancarStatusSchema>;
export type AvancarStatusInputForm = z.input<typeof avancarStatusSchema>;

// ============================================================================
// Marcar Aprovação do orçamento (Story 2.2 / FR-7)
// ============================================================================

// Schema simples — só identifica a OS e o requestId de idempotência. Status
// = "Orcamento" é validado dinamicamente pela action (depende do DB).
export const marcarAprovadoSchema = z.object({
  numero: z.number().int().positive("número da OS inválido"),
  requestId: z.string().uuid("requestId inválido"),
});

export type MarcarAprovadoInput = z.infer<typeof marcarAprovadoSchema>;
export type MarcarAprovadoInputForm = z.input<typeof marcarAprovadoSchema>;

// ============================================================================
// Terminais alternativos — Cancelado (FR-8) + Sem solução (FR-9) / Story 2.3
// ============================================================================

// Shape idêntico a marcarAprovadoSchema (só identifica a OS + requestId de
// idempotência). O Status terminal é fixo por action, não vem no payload.
// Definidos separadamente para casar 1:1 com cancelarOs/semSolucaoOs
// (architecture §Mapeamento FR → arquivos).
export const cancelarOsSchema = z.object({
  numero: z.number().int().positive("número da OS inválido"),
  requestId: z.string().uuid("requestId inválido"),
});

export type CancelarOsInput = z.infer<typeof cancelarOsSchema>;
export type CancelarOsInputForm = z.input<typeof cancelarOsSchema>;

export const semSolucaoSchema = z.object({
  numero: z.number().int().positive("número da OS inválido"),
  requestId: z.string().uuid("requestId inválido"),
});

export type SemSolucaoInput = z.infer<typeof semSolucaoSchema>;
export type SemSolucaoInputForm = z.input<typeof semSolucaoSchema>;
