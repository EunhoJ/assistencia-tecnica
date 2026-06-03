import type { EstadoPagamento } from "@/lib/domain/pagamento";
import type { StatusOs } from "@/lib/domain/status";
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

// View serializável e achatada de uma OS, reusável pela lista recente (server)
// e pelos resultados da busca (Story 4.1, que cruza a fronteira RSC→client e o
// Server Action). `id` é STRING: o id BigInt do DB não serializa pela fronteira
// (mesma razão de `ClienteSugestao.id`). `Date` é serializável (Flight).
export type OsResumo = {
  id: string;
  numeroSequencial: number;
  clienteNome: string;
  aparelhoTipo: string;
  aparelhoDescricao: string | null;
  status: StatusOs;
  estadoPagamento: EstadoPagamento;
  criadoEm: Date;
};

export function toOsResumo(row: OsDashboardRow): OsResumo {
  return {
    id: row.id.toString(),
    numeroSequencial: row.numeroSequencial,
    clienteNome: row.cliente.nome,
    aparelhoTipo: row.aparelhoTipo,
    aparelhoDescricao: row.aparelhoDescricao,
    status: row.status as StatusOs,
    estadoPagamento: row.estadoPagamento as EstadoPagamento,
    criadoEm: row.criadoEm,
  };
}
