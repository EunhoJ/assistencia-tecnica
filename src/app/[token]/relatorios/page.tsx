import { HandCoins, PackageSearch } from "lucide-react";
import Link from "next/link";

// Hub de Relatórios (Story 3.2). "Devolvido não pago" (FR-13) + "Aparelhos
// parados" (FR-14, Story 3.3). A Story 3.4 (Resumo financeiro) adiciona o seu.

export default async function RelatoriosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>

      <Link
        href={`/${token}/relatorios/devolvido-nao-pago`}
        className="hover:bg-muted/50 flex min-h-[44px] items-center gap-3 rounded-md border px-4 py-3"
      >
        <HandCoins className="size-5" />
        <span>
          <span className="block font-medium">Devolvido não pago</span>
          <span className="text-muted-foreground text-sm">
            Quem levou o aparelho e ainda não pagou
          </span>
        </span>
      </Link>

      <Link
        href={`/${token}/relatorios/aparelhos-parados`}
        className="hover:bg-muted/50 flex min-h-[44px] items-center gap-3 rounded-md border px-4 py-3"
      >
        <PackageSearch className="size-5" />
        <span>
          <span className="block font-medium">Aparelhos parados</span>
          <span className="text-muted-foreground text-sm">
            OSs ativas travadas há muito tempo no mesmo status
          </span>
        </span>
      </Link>
    </section>
  );
}
