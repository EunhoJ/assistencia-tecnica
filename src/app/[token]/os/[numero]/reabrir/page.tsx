import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BadgeStatus } from "@/components/os/badge-status";
import { FormularioReabrirOs } from "@/components/os/formulario-reabrir-os";
import { ehTerminal, type StatusOs } from "@/lib/domain/status";
import { formatDataHora } from "@/lib/format/data";
import { formatBRL } from "@/lib/format/moeda";
import { buscarOsPorNumero } from "@/lib/queries/buscar-os-por-numero";

// Fluxo dedicado de reabertura (FR-19 / Story 2.7). Server Component: mostra o
// contexto da OS terminal + o formulário de 2 passos. Defende acesso direto:
// se a OS não é terminal, redireciona ao detalhe.

export default async function ReabrirOsPage({
  params,
}: {
  params: Promise<{ token: string; numero: string }>;
}) {
  const { token, numero: numeroStr } = await params;
  const numero = Number(numeroStr);

  if (!Number.isInteger(numero) || numero <= 0) {
    notFound();
  }

  const os = await buscarOsPorNumero(numero);
  if (!os) {
    notFound();
  }

  if (!ehTerminal(os.status as StatusOs)) {
    redirect(`/${token}/os/${os.numeroSequencial}`);
  }

  const tinhaPago = os.estadoPagamento === "Pago" && os.pagoEm !== null;
  const pagamentoResumo = tinhaPago
    ? `${formatBRL(os.valorCobradoCentavos ?? 0)} — pago em ${formatDataHora(os.pagoEm!, "MM/yyyy")}`
    : null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Reabrir OS #{os.numeroSequencial}
      </h1>
      <div className="mb-6 flex flex-col gap-1 text-sm">
        <span>{os.cliente.nome}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status atual:</span>
          <BadgeStatus status={os.status as StatusOs} />
        </div>
        <span className="text-muted-foreground text-xs">
          Criada em {formatDataHora(os.criadoEm)} · Alterado em{" "}
          {formatDataHora(os.statusAlteradoEm)}
        </span>
      </div>

      <FormularioReabrirOs
        numero={os.numeroSequencial}
        tinhaPago={tinhaPago}
        pagamentoResumo={pagamentoResumo}
      />

      <Link
        href={`/${token}/os/${os.numeroSequencial}`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar ao detalhe
      </Link>
    </section>
  );
}
