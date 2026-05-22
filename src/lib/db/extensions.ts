// Extension Prisma 7 que injeta `deletado_em: null` automaticamente em todos os
// READS dos modelos `Os` e `Cliente`. Operações `update`, `delete` e `upsert`
// NÃO são interceptadas: a action de soft-delete (Story 2.6) faz
// `update({ data: { deletado_em: now() } })` explicitamente.
//
// Este arquivo é puro (não importa `client.ts`) para ser testável em isolamento.
// Os wrappers da Lixeira (`findOsDeletadas`, `restaurarOs`, etc.) recebem o
// cliente sem extension via parâmetro — Story 2.6 passa `dbBase` de
// `@/lib/db/client`.

import type { PrismaClient } from "@/generated/prisma/client";

type ReadOp = "findMany" | "findUnique" | "findFirst" | "count" | "aggregate";

type Handler = (params: {
  args: { where?: Record<string, unknown> };
  query: (args: { where?: Record<string, unknown> }) => Promise<unknown>;
}) => Promise<unknown>;

function buildHandlers(): Record<ReadOp, Handler> {
  return {
    findMany: ({ args, query }) => {
      args.where = { deletado_em: null, ...args.where };
      return query(args);
    },
    findUnique: ({ args, query }) => {
      args.where = { ...args.where, deletado_em: null };
      return query(args);
    },
    findFirst: ({ args, query }) => {
      args.where = { deletado_em: null, ...args.where };
      return query(args);
    },
    count: ({ args, query }) => {
      args.where = { deletado_em: null, ...args.where };
      return query(args);
    },
    aggregate: ({ args, query }) => {
      args.where = { deletado_em: null, ...args.where };
      return query(args);
    },
  };
}

/**
 * Extension Prisma de soft-delete na forma inline (aceita por `$extends` direto).
 * Não usamos `Prisma.defineExtension` porque ele retorna uma função opaca que
 * impede inspeção/teste dos handlers.
 */
export function softDeleteExtension() {
  return {
    name: "soft-delete" as const,
    query: {
      os: buildHandlers(),
      cliente: buildHandlers(),
    },
  };
}

// ============================================================================
// Wrappers explícitos para Lixeira (Story 2.6).
// Recebem o cliente cru (`dbBase`) por DI — caller importa de `@/lib/db/client`.
// ============================================================================

export function findOsDeletadas(db: PrismaClient) {
  return db.os.findMany({ where: { deletadoEm: { not: null } } });
}

export function findClientesDeletados(db: PrismaClient) {
  return db.cliente.findMany({ where: { deletadoEm: { not: null } } });
}

export function restaurarOs(db: PrismaClient, id: bigint) {
  return db.os.update({ where: { id }, data: { deletadoEm: null } });
}

export function restaurarCliente(db: PrismaClient, id: bigint) {
  return db.cliente.update({ where: { id }, data: { deletadoEm: null } });
}
