"use server";

import { fieldsFromZod } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import { normalizarTelefone } from "@/lib/format/telefone";
import { normalizarTexto } from "@/lib/format/texto";
import {
  buscarClientesSchema,
  type BuscarClientesInput,
} from "@/lib/schemas/cliente.schema";

// Sugestão retornada ao client. `id` é BigInt no DB serializado como string
// para passar pela boundary do Server Action (BigInt não é JSON-serializável).
export type ClienteSugestao = {
  id: string;
  nome: string;
  telefone: string;
};

// Server Action de busca para o autocomplete de Cliente (FR-11).
// Usa $queryRaw porque o índice GIN trgm (Story 1.3) exige que a WHERE
// use literalmente `lower(public.f_unaccent(nome))` — Prisma query builder
// não permite expressões SQL customizadas. Atenção: $queryRaw bypassa a
// soft-delete extension; `deletado_em IS NULL` é manual aqui.
export async function buscarClientes(
  input: BuscarClientesInput,
): Promise<ActionResult<ClienteSugestao[]>> {
  const parsed = buscarClientesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const tel = normalizarTelefone(parsed.data.query);
  const nome = normalizarTexto(parsed.data.query);
  const limite = parsed.data.limite;

  const rows = await db.$queryRaw<
    Array<{
      id: bigint;
      nome: string;
      telefone: string;
    }>
  >`
    SELECT id, nome, telefone
    FROM cliente
    WHERE deletado_em IS NULL
      AND (
        (length(${tel}) >= 4 AND telefone_normalizado LIKE ${tel} || '%')
        OR
        (length(${nome}) >= 2 AND lower(public.f_unaccent(nome)) LIKE ${nome} || '%')
      )
    ORDER BY
      CASE
        WHEN length(${tel}) >= 4 AND telefone_normalizado LIKE ${tel} || '%' THEN 1
        ELSE 2
      END,
      criado_em DESC
    LIMIT ${limite}
  `;

  const data: ClienteSugestao[] = rows.map((r) => ({
    id: r.id.toString(),
    nome: r.nome,
    telefone: r.telefone,
  }));

  return { ok: true, data };
}
