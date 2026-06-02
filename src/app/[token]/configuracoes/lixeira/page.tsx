import Link from "next/link";

import { TabelaLixeira } from "@/components/configuracoes/tabela-lixeira";
import { listarLixeira } from "@/lib/queries/listar-lixeira";

// Tela Lixeira (FR-4 / Story 2.6). Lista as OSs soft-deletadas e permite
// restaurar. Usa `dbBase` via `listarLixeira` (as deletadas estão ocultas
// para o `db` com extension).

export default async function LixeiraPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const linhas = await listarLixeira();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Lixeira</h1>
      <TabelaLixeira linhas={linhas} />
      <Link
        href={`/${token}/configuracoes`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar às configurações
      </Link>
    </section>
  );
}
