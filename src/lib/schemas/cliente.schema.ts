import { z } from "zod";

// Schema do bloco de Cliente dentro do form de criar OS (FR-2 — cadastro
// inline). Reutilizado pelo schema de criarOs (composição).

export const clienteInlineSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
});

export type ClienteInlineInput = z.infer<typeof clienteInlineSchema>;
