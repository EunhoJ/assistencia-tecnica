import { db } from "@/lib/db/client";
import { calcularDiasCorridos } from "@/lib/format/data";

// Relatório "Devolvido não pago" (FR-13 / Story 3.2). Materializa em SQL a
// regra `devolvidoENaoPago` (domain/pagamento.ts, Story 2.4): Status terminal
// + estado Pendente + valor > 0. Soft-deleted excluídas pela extension (`db`).
// Ordenado por antiguidade (status_alterado_em asc — mais antigas primeiro).

export async function relatorioDevolvidoNaoPago() {
  const rows = await db.os.findMany({
    where: {
      status: { in: ["Entregue", "Cancelado", "Sem_solucao"] },
      estadoPagamento: "Pendente",
      valorCobradoCentavos: { gt: 0 },
    },
    orderBy: { statusAlteradoEm: "asc" },
    select: {
      numeroSequencial: true,
      valorCobradoCentavos: true,
      statusAlteradoEm: true,
      status: true,
      cliente: { select: { nome: true, telefoneNormalizado: true } },
    },
  });

  const agora = new Date();

  return rows.map((r) => ({
    numero: r.numeroSequencial,
    clienteNome: r.cliente.nome,
    clienteTelefone: r.cliente.telefoneNormalizado, // dígitos (tel:/wa.me + exibição)
    valorCobradoCentavos: r.valorCobradoCentavos!,
    status: r.status,
    diasDesdeTerminal: calcularDiasCorridos(r.statusAlteradoEm, agora),
  }));
}

export type DevolvidoNaoPagoRow = Awaited<
  ReturnType<typeof relatorioDevolvidoNaoPago>
>[number];
