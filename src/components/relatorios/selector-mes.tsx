import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatMesAno, proximoMes } from "@/lib/format/data";

// Seletor de mês do Resumo financeiro (FR-15 / Story 3.4). Server Component —
// navegação por `<Link>` nativo mudando `?mes=YYYY-MM`; sem client JS (espelha a
// decisão dos `<details>` da 3.3). O ">" é desabilitado no mês corrente —
// projetar futuro não faz sentido na v1.

function mesParam(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function mesAnteriorDe(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function SelectorMes({
  token,
  ano,
  mes,
  podeAvancar,
}: {
  token: string;
  ano: number;
  mes: number;
  podeAvancar: boolean;
}) {
  const base = `/${token}/relatorios/resumo-financeiro`;
  const anterior = mesAnteriorDe(ano, mes);
  const proximo = proximoMes(ano, mes);

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={`${base}?mes=${mesParam(anterior.ano, anterior.mes)}`}
        aria-label="Mês anterior"
        className="hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md border"
      >
        <ChevronLeft className="size-5" />
      </Link>

      <span className="text-lg font-medium">{formatMesAno(ano, mes)}</span>

      {podeAvancar ? (
        <Link
          href={`${base}?mes=${mesParam(proximo.ano, proximo.mes)}`}
          aria-label="Próximo mês"
          className="hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md border"
        >
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="Próximo mês indisponível"
          className="text-muted-foreground/40 inline-flex size-11 cursor-not-allowed items-center justify-center rounded-md border"
        >
          <ChevronRight className="size-5" />
        </span>
      )}
    </div>
  );
}
