import { db } from "@/lib/db/client";
import { calcularDiasParados, excedeLimiar } from "@/lib/domain/parados";
import { STATUS_ATIVOS } from "@/lib/domain/status";
import { buscarConfig } from "@/lib/queries/buscar-config";

// Relatório "Aparelhos parados" (FR-14 / Story 3.3). OSs em Status ATIVO
// paradas no mesmo Status há ≥ limiar dias (config FR-18). `db` exclui
// soft-deleted; o filtro `status IN (ativos)` casa `idx_os_status__ativo`.
//
// O filtro de DATA é feito em JS (não SQL): `diasParados` é dias de calendário
// em São Paulo (não blocos de 24h), inviável em Prisma findMany sem $queryRaw
// timezone-aware. Volume pequeno (<5.000 OSs; ativos é subconjunto) → folgado.

export type AparelhoParadoItem = {
  numero: number;
  clienteNome: string;
  statusAtual: string;
  aparelhoTipo: string;
  aparelhoDescricao: string | null;
  diasParados: number;
};

export async function relatorioAparelhosParados(): Promise<{
  limiar: number;
  itens: AparelhoParadoItem[];
}> {
  const { limiarDiasParados: limiar } = await buscarConfig();

  const rows = await db.os.findMany({
    where: { status: { in: [...STATUS_ATIVOS] } },
    select: {
      numeroSequencial: true,
      status: true,
      aparelhoTipo: true,
      aparelhoDescricao: true,
      statusAlteradoEm: true,
      cliente: { select: { nome: true } },
    },
  });

  const agora = new Date();

  const itens = rows
    .map((r) => ({
      numero: r.numeroSequencial,
      clienteNome: r.cliente.nome,
      statusAtual: r.status,
      aparelhoTipo: r.aparelhoTipo,
      aparelhoDescricao: r.aparelhoDescricao,
      diasParados: calcularDiasParados(r.statusAlteradoEm, agora),
    }))
    .filter((i) => excedeLimiar(i.diasParados, limiar))
    .sort((a, b) => b.diasParados - a.diasParados);

  return { limiar, itens };
}
