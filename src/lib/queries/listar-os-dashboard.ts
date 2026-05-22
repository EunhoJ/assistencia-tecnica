import { db } from "@/lib/db/client";

// Lista as N OSs mais recentes para o dashboard (FR-5 apoio + base do Epic 2).
// Usa `db` (com soft-delete extension da Story 1.3) — OSs deletadas filtradas
// automaticamente.

export async function listarOsDashboard(limite = 20) {
  return db.os.findMany({
    take: limite,
    orderBy: { criadoEm: "desc" },
    include: { cliente: true },
  });
}

export type OsDashboardRow = Awaited<ReturnType<typeof listarOsDashboard>>[number];
