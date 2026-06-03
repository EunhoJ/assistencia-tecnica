import { db } from "@/lib/db/client";
import { toOsResumo } from "@/lib/queries/listar-os-dashboard";

// Histórico de OSs de um Cliente (FR-12 / Story 4.2). Recebe o `id` (PK BigInt)
// como string da URL. Valida que é numérico ANTES de `BigInt()` — `BigInt("abc")`
// lança e viraria 500; aqui devolvemos null → a página chama notFound() (404).
//
// `db.cliente.findUnique` e `db.os.findMany` herdam o filtro `deletadoEm: null`
// da soft-delete extension (Story 1.3): Cliente soft-deleted → null; OSs
// soft-deletadas somem do histórico automaticamente.

export async function historicoCliente(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const clienteId = BigInt(id);

  const cliente = await db.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      nome: true,
      telefone: true,
      telefoneNormalizado: true,
      criadoEm: true,
    },
  });
  if (!cliente) return null;

  const oss = await db.os.findMany({
    where: { clienteId },
    orderBy: { criadoEm: "desc" },
    include: { cliente: true },
  });

  return {
    cliente: {
      id: cliente.id.toString(),
      nome: cliente.nome,
      telefone: cliente.telefone,
      telefoneNormalizado: cliente.telefoneNormalizado,
      criadoEm: cliente.criadoEm,
    },
    oss: oss.map(toOsResumo),
  };
}

export type HistoricoCliente = NonNullable<
  Awaited<ReturnType<typeof historicoCliente>>
>;
