import Link from "next/link";

import { OsCard } from "@/components/os/os-card";
import { BuscaGlobal } from "@/components/shared/busca-global";
import { Button } from "@/components/ui/button";
import { listarOsDashboard, toOsResumo } from "@/lib/queries/listar-os-dashboard";

// Dashboard: campo de busca global (Story 4.1) + lista das 20 OSs mais recentes.
// Server Component. Soft-deleted ocultadas automaticamente pela extension (1.3).
// A lista recente entra como `children` de <BuscaGlobal>; quando há busca ativa
// o client a substitui pelos resultados.

export default async function Dashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const recentes = (await listarOsDashboard()).map(toOsResumo);

  if (recentes.length === 0) {
    return (
      <section className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Nenhuma OS cadastrada ainda
        </h1>
        <p className="text-muted-foreground text-lg">
          Comece cadastrando a primeira ordem de serviço da oficina.
        </p>
        <Button asChild size="lg" className="min-h-[56px] px-10 text-lg">
          <Link href={`/${token}/os/nova`}>+ Nova OS</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">OSs recentes</h1>
        <Button asChild size="lg" className="min-h-[44px]">
          <Link href={`/${token}/os/nova`}>+ Nova OS</Link>
        </Button>
      </div>

      <BuscaGlobal token={token}>
        <ul className="flex flex-col gap-3">
          {recentes.map((os) => (
            <li key={os.id}>
              <OsCard os={os} token={token} />
            </li>
          ))}
        </ul>
      </BuscaGlobal>
    </section>
  );
}
