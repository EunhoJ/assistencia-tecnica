import { HandCoins } from "lucide-react";
import Link from "next/link";

// Hub de Relatórios (Story 3.2). Por ora só "Devolvido não pago" (FR-13).
// As Stories 3.3 (Aparelhos parados) e 3.4 (Resumo financeiro) adicionam seus
// links aqui.

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
    </section>
  );
}
