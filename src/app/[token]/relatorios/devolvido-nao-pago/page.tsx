import { TabelaDevolvidoNaoPago } from "@/components/relatorios/tabela-devolvido-nao-pago";
import { relatorioDevolvidoNaoPago } from "@/lib/queries/relatorio-devolvido-nao-pago";

// Relatório "Devolvido não pago" (FR-13 / Story 3.2). Server Component
// dinâmico: cada load roda a query atual (OSs marcadas Pago/reabertas somem).

export default async function DevolvidoNaoPagoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const linhas = await relatorioDevolvidoNaoPago();
  const totalCentavos = linhas.reduce((s, l) => s + l.valorCobradoCentavos, 0);

  return (
    <TabelaDevolvidoNaoPago
      token={token}
      linhas={linhas}
      totalCentavos={totalCentavos}
    />
  );
}
