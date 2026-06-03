import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import type { FormaPagamento } from "@/lib/domain/pagamento";
import type { ResumoFinanceiro } from "@/lib/queries/resumo-financeiro-mensal";
import { formatMesAno } from "@/lib/format/data";
import { formatBRL } from "@/lib/format/moeda";
import { cn } from "@/lib/utils";

import { SelectorMes } from "./selector-mes";

// Resumo financeiro mensal (FR-15 / Story 3.4). Server Component — total, delta
// vs mês anterior (verde/vermelho ou "Sem comparativo" quando anterior é 0) e
// breakdown por Forma de pagamento. Zero-state preserva o seletor de mês.

const FORMA_LABEL: Record<FormaPagamento, string> = {
  PIX: "PIX",
  Dinheiro: "Dinheiro",
  Cartao: "Cartão",
};

const ORDEM_FORMAS: FormaPagamento[] = ["PIX", "Dinheiro", "Cartao"];

// "18.4" → "18,4%" (vírgula decimal pt-BR, sem Intl).
function formatPercent(n: number): string {
  return `${String(n).replace(".", ",")}%`;
}

function mesAnteriorDe(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function ResumoFinanceiroMes({
  token,
  resumo,
  podeAvancar,
}: {
  token: string;
  resumo: ResumoFinanceiro;
  podeAvancar: boolean;
}) {
  const { ano, mes, atual, delta } = resumo;
  const anterior = mesAnteriorDe(ano, mes);
  const positivo = delta.absoluto >= 0;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Resumo financeiro</h1>

      <div className="my-6">
        <SelectorMes
          token={token}
          ano={ano}
          mes={mes}
          podeAvancar={podeAvancar}
        />
      </div>

      {atual.qtdOss === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center">
          Sem pagamentos em {formatMesAno(ano, mes)}.
        </p>
      ) : (
        <>
          <div className="rounded-md border p-6 text-center">
            <p className="text-muted-foreground text-sm">Total faturado</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {formatBRL(atual.totalCentavos)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {atual.qtdOss} {atual.qtdOss === 1 ? "OS paga" : "OSs pagas"}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center text-sm">
            {delta.percentual === null ? (
              <span className="text-muted-foreground">
                Sem comparativo com {formatMesAno(anterior.ano, anterior.mes)}
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  positivo
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400",
                )}
              >
                {positivo ? (
                  <ArrowUp className="size-4" />
                ) : (
                  <ArrowDown className="size-4" />
                )}
                {positivo ? "+" : "−"}
                {formatBRL(Math.abs(delta.absoluto))} ({positivo ? "+" : "−"}
                {formatPercent(Math.abs(delta.percentual))}) vs{" "}
                {formatMesAno(anterior.ano, anterior.mes)}
              </span>
            )}
          </div>

          <ul className="mt-6 flex flex-col gap-3">
            {ORDEM_FORMAS.map((forma) => {
              const b = atual.breakdown[forma];
              return (
                <li key={forma} className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{FORMA_LABEL[forma]}</span>
                    <span className="text-muted-foreground text-sm">
                      {formatBRL(b.centavos)} ({formatPercent(b.percentual)}) —{" "}
                      {b.count} {b.count === 1 ? "OS" : "OSs"}
                    </span>
                  </div>
                  <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${b.percentual}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
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
