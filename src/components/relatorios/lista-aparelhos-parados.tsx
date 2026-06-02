import Link from "next/link";

import type { AparelhoParadoItem } from "@/lib/queries/relatorio-aparelhos-parados";
import { cn } from "@/lib/utils";

// Lista do relatório "Aparelhos parados" (FR-14 / Story 3.3). Server Component
// — só dados + links. Agrupado por Status (ordem dos ativos), cada grupo num
// <details> nativo (colapsável sem client JS), com a contagem no <summary>.

const STATUS_LABEL: Record<string, string> = {
  Recebido: "Recebido",
  Orcamento: "Orçamento",
  Aguardando_peca: "Aguardando peça",
  Consertado: "Consertado",
};

// Ordem dos grupos = ordem dos Status ativos.
const ORDEM_ATIVOS = ["Recebido", "Orcamento", "Aguardando_peca", "Consertado"];

export function ListaAparelhosParados({
  token,
  limiar,
  itens,
}: {
  token: string;
  limiar: number;
  itens: AparelhoParadoItem[];
}) {
  // Agrupa preservando a ordem desc por diasParados (itens já vêm ordenados).
  const grupos = ORDEM_ATIVOS.map((status) => ({
    status,
    itens: itens.filter((i) => i.statusAtual === status),
  })).filter((g) => g.itens.length > 0);

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Aparelhos parados</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Considerando parados há {limiar} dias ou mais —{" "}
        <Link
          href={`/${token}/configuracoes`}
          className="underline underline-offset-4"
        >
          configure em Configurações
        </Link>
        .
      </p>

      {itens.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center">
          Nada parado — bom ritmo.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map((grupo) => (
            <details key={grupo.status} open className="rounded-md border">
              <summary className="flex min-h-[44px] cursor-pointer items-center px-4 font-medium">
                {STATUS_LABEL[grupo.status] ?? grupo.status} ({grupo.itens.length})
              </summary>
              <ul className="flex flex-col gap-2 border-t p-4">
                {grupo.itens.map((i) => (
                  <li
                    key={i.numero}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/${token}/os/${i.numero}`}
                        className="text-primary font-semibold underline-offset-4 hover:underline"
                      >
                        #{i.numero}
                      </Link>
                      <span>{i.clienteNome}</span>
                      <span className="text-muted-foreground text-sm">
                        {i.aparelhoTipo}
                        {i.aparelhoDescricao ? ` — ${i.aparelhoDescricao}` : ""}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex h-8 items-center self-start rounded-full px-3 text-sm font-medium",
                        i.diasParados >= 2 * limiar
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
                      )}
                    >
                      {i.diasParados} dias
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      <Link
        href={`/${token}/relatorios`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar aos relatórios
      </Link>
    </section>
  );
}
