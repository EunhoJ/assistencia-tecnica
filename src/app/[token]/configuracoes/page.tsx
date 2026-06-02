import Link from "next/link";
import { Trash2 } from "lucide-react";

import { FormularioLimiar } from "@/components/configuracoes/formulario-limiar";
import { buscarConfig } from "@/lib/queries/buscar-config";

// Configurações. Seção do Limiar de dias parados (FR-18 / Story 3.1) +
// acesso à Lixeira (FR-4 / Story 2.6).

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const config = await buscarConfig();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Limiar de dias parados</h2>
        <FormularioLimiar valorAtual={config.limiarDiasParados} />
      </div>

      <Link
        href={`/${token}/configuracoes/lixeira`}
        className="hover:bg-muted/50 flex min-h-[44px] items-center gap-3 rounded-md border px-4 py-3"
      >
        <Trash2 className="size-5" />
        <span>
          <span className="block font-medium">Lixeira</span>
          <span className="text-muted-foreground text-sm">
            OSs excluídas — visualizar e restaurar
          </span>
        </span>
      </Link>
    </section>
  );
}
