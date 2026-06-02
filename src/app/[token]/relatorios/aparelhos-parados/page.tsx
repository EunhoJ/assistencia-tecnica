import { ListaAparelhosParados } from "@/components/relatorios/lista-aparelhos-parados";
import { relatorioAparelhosParados } from "@/lib/queries/relatorio-aparelhos-parados";

// Relatório "Aparelhos parados" (FR-14 / Story 3.3). Server Component dinâmico:
// cada load lê o limiar atual (config) + a query (mudança de limiar reflete).

export default async function AparelhosParadosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { limiar, itens } = await relatorioAparelhosParados();

  return <ListaAparelhosParados token={token} limiar={limiar} itens={itens} />;
}
