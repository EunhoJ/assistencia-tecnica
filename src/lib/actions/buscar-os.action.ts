"use server";

import { fieldsFromZod } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db/client";
import type { EstadoPagamento } from "@/lib/domain/pagamento";
import type { StatusOs } from "@/lib/domain/status";
import { normalizarTelefone } from "@/lib/format/telefone";
import { normalizarTexto } from "@/lib/format/texto";
import type { OsResumo } from "@/lib/queries/listar-os-dashboard";
import { buscaOsSchema, type BuscaOsInput } from "@/lib/schemas/os.schema";

// Busca global de OS por nome do Cliente OU telefone (FR-16 / FR-17, Story 4.1).
// Espelha `buscar-clientes.action.ts` (1.6): usa $queryRaw porque a WHERE precisa
// de `lower(public.f_unaccent(nome))` literal (índice GIN trgm) — o query builder
// do Prisma não expressa. ATENÇÃO: $queryRaw bypassa a soft-delete extension, por
// isso `deletado_em IS NULL` é manual nas DUAS tabelas (os + cliente).
//
// Nome = prefixo (accent+case-insensitive via f_unaccent). Telefone = substring
// de dígitos, só quando ≥4 (FR-17). `idx_cliente_telefone_normalizado` é btree e
// não acelera substring; seq scan é aceitável no volume (<5.000 OSs).

type RawRow = {
  id: bigint;
  numeroSequencial: number;
  clienteNome: string;
  aparelhoTipo: string;
  aparelhoDescricao: string | null;
  status: string;
  estadoPagamento: string;
  criadoEm: Date;
};

export async function buscarOs(
  input: BuscaOsInput,
): Promise<ActionResult<OsResumo[]>> {
  const parsed = buscaOsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDACAO", campos: fieldsFromZod(parsed.error) },
    };
  }

  const tel = normalizarTelefone(parsed.data.query);
  const nome = normalizarTexto(parsed.data.query.trim());

  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      o.id,
      o.numero_sequencial AS "numeroSequencial",
      c.nome AS "clienteNome",
      o.aparelho_tipo AS "aparelhoTipo",
      o.aparelho_descricao AS "aparelhoDescricao",
      o.status,
      o.estado_pagamento AS "estadoPagamento",
      o.criado_em AS "criadoEm"
    FROM os o
    JOIN cliente c ON c.id = o.cliente_id
    WHERE o.deletado_em IS NULL
      AND c.deletado_em IS NULL
      AND (
        (length(${tel}) >= 4 AND c.telefone_normalizado LIKE '%' || ${tel} || '%')
        OR
        (length(${nome}) >= 1 AND lower(public.f_unaccent(c.nome)) LIKE ${nome} || '%')
      )
    ORDER BY
      CASE
        WHEN length(${tel}) >= 4 AND c.telefone_normalizado LIKE '%' || ${tel} || '%' THEN 1
        ELSE 2
      END,
      o.criado_em DESC
    LIMIT 50
  `;

  const data: OsResumo[] = rows.map((r) => ({
    id: r.id.toString(),
    numeroSequencial: r.numeroSequencial,
    clienteNome: r.clienteNome,
    aparelhoTipo: r.aparelhoTipo,
    aparelhoDescricao: r.aparelhoDescricao,
    status: r.status as StatusOs,
    estadoPagamento: r.estadoPagamento as EstadoPagamento,
    criadoEm: r.criadoEm,
  }));

  return { ok: true, data };
}
