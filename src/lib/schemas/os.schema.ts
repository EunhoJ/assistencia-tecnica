import { z } from "zod";

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
