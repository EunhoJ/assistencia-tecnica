// Helper transacional ÚNICO para mudar o Status de uma OS. Regra Inegociável
// 4 vira estrutural: nenhuma Server Action grava `status` direto via Prisma —
// todas (avancarStatus, cancelarOs, semSolucaoOs, reabrirOs nas próximas
// stories) passam por aqui. Garante atualização atômica de `status` E
// `statusAlteradoEm` num único round-trip.
//
// Caller é dono da $transaction e passa `tx` (TransactionClient). Mesmo
// padrão dos helpers de idempotência em lib/actions/helpers.ts.
//
// Revisão por grep:
//   grep -r "tx\\.os\\.update.*status:" src/lib/actions/  # deve ser vazio

import type { StatusOs } from "@/lib/domain/status";

// Tipar precisamente TransactionClient com extension soft-delete é
// não-trivial em Prisma 7. Helpers internos rodam em código server trusted —
// aceitar `any` localmente para evitar cast no callsite (mesmo idiom do
// lib/actions/helpers.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

export async function alterarStatus(
  tx: Tx,
  osId: bigint,
  novoStatus: StatusOs,
) {
  return tx.os.update({
    where: { id: osId },
    data: {
      status: novoStatus,
      statusAlteradoEm: new Date(),
    },
  });
}
