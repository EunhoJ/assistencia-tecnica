import { z } from "zod";

// Schema do bloco de Cliente dentro do form de criar OS (FR-2 — cadastro
// inline). Reutilizado pelo schema de criarOs (composição).

export const clienteInlineSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
});

export type ClienteInlineInput = z.infer<typeof clienteInlineSchema>;

// Schema de input para `buscarClientes` (Story 1.6 — autocomplete FR-11).
// `query` é texto livre (pode conter dígitos ou letras); a action decide
// internamente como interpretar (telefone vs nome) via normalização.
export const buscarClientesSchema = z.object({
  query: z.string().min(1, "query é obrigatória"),
  limite: z.number().int().positive().max(20).default(8),
});

export type BuscarClientesInput = z.infer<typeof buscarClientesSchema>;
