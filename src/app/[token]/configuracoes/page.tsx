import Link from "next/link";
import { Trash2 } from "lucide-react";

// Shell de Configurações (Story 2.6). Por ora só dá acesso à Lixeira (FR-4).
// O Epic 3 estende esta página com o controle de Limiar de dias parados (FR-18).

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Configurações</h1>
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
