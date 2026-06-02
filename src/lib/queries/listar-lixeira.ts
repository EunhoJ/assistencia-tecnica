import { dbBase } from "@/lib/db/client";

// Lista as OSs soft-deletadas para a tela Lixeira (FR-4 / Story 2.6). Usa
// `dbBase` (cru) porque `db` (com extension) ocultaria justamente as deletadas.
// Query dedicada (não o wrapper `findOsDeletadas`) por precisar de
// `include: cliente` e ordenação — espelha `listar-os-dashboard.ts`.

export async function listarLixeira() {
  return dbBase.os.findMany({
    where: { deletadoEm: { not: null } },
    orderBy: { deletadoEm: "desc" },
    include: { cliente: true },
  });
}

export type LixeiraRow = Awaited<ReturnType<typeof listarLixeira>>[number];
