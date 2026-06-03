import { notFound } from "next/navigation";

import { FichaCliente } from "@/components/cliente/ficha-cliente";
import { historicoCliente } from "@/lib/queries/historico-cliente";

// Ficha do Cliente (FR-12 / Story 4.2). Server Component. `[id]` é a PK interna
// do Cliente (BigInt) — único lugar que a expõe na URL. `historicoCliente`
// valida o id e oculta soft-deleted; null → notFound().

export default async function ClienteHistoricoPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;

  const data = await historicoCliente(id);
  if (!data) {
    notFound();
  }

  return <FichaCliente token={token} cliente={data.cliente} oss={data.oss} />;
}
