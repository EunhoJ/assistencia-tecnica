// Singleton do PrismaClient com adapter Neon. Em Prisma 7, o adapter é
// obrigatório e o `PrismaClient` é importado do output gerado (não de
// `@prisma/client`). Em dev, reusa instância via globalThis para evitar
// duplicação por HMR.

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

import { softDeleteExtension } from "./extensions";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurado");
}

const DATABASE_URL = process.env.DATABASE_URL;

function buildAdapter() {
  return new PrismaNeon({ connectionString: DATABASE_URL });
}

// `dbBase`: cliente cru, sem extension de soft-delete. Usado pelos wrappers
// explícitos da Lixeira (Story 2.6) — `findOsDeletadas`, `restaurarOs`, etc.
// Nunca usar em features que precisem respeitar soft-delete; use `db`.
type GlobalCache = {
  __dbBase?: PrismaClient;
  __db?: ReturnType<typeof buildDb>;
};

function buildDbBase(): PrismaClient {
  return new PrismaClient({ adapter: buildAdapter() });
}

function buildDb() {
  return buildDbBase().$extends(softDeleteExtension());
}

const globalForPrisma = globalThis as unknown as GlobalCache;

export const dbBase: PrismaClient = globalForPrisma.__dbBase ?? buildDbBase();
export const db = globalForPrisma.__db ?? buildDb();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__dbBase = dbBase;
  globalForPrisma.__db = db;
}
