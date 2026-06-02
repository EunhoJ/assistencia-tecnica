import { z } from "zod";

// Schema de input para atualizar o Limiar de dias parados (FR-18 / Story 3.1).
// Inteiro positivo, máximo razoável de 1 ano. Rejeita 0, negativos, decimais e
// strings não numéricas (z.number rejeita NaN de campo vazio).

export const atualizarConfigSchema = z.object({
  limiarDiasParados: z
    .number({ error: "Digite um número válido" })
    .int("deve ser um número inteiro")
    .positive("deve ser maior que zero")
    .max(365, "máximo de 365 dias"),
  requestId: z.string().uuid("requestId inválido"),
});

export type AtualizarConfigInput = z.infer<typeof atualizarConfigSchema>;
export type AtualizarConfigInputForm = z.input<typeof atualizarConfigSchema>;
