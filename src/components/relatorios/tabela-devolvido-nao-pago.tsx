import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import type { DevolvidoNaoPagoRow } from "@/lib/queries/relatorio-devolvido-nao-pago";
import { formatBRL } from "@/lib/format/moeda";
import { formatarTelefoneSimples } from "@/lib/format/telefone";

// Tabela do relatório "Devolvido não pago" (FR-13 / Story 3.2). Server
// Component — só dados + links `<a>` (tel:/wa.me/OS), zero interatividade.
// "Mostra, não age": WhatsApp sem `?text=`; nenhuma chamada de API.

const LABEL_TERMINAL: Record<string, string> = {
  Entregue: "entregue",
  Cancelado: "cancelado",
  Sem_solucao: "sem solução",
};

export function TabelaDevolvidoNaoPago({
  token,
  linhas,
  totalCentavos,
}: {
  token: string;
  linhas: DevolvidoNaoPagoRow[];
  totalCentavos: number;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Devolvido não pago</h1>
      <p className="text-muted-foreground mt-1 mb-6">
        Total acumulado:{" "}
        <span className="text-foreground font-semibold">
          {formatBRL(totalCentavos)}
        </span>
      </p>

      {linhas.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center">
          Nada para mostrar — todas as OSs entregues estão pagas.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {linhas.map((l) => (
            <li
              key={l.numero}
              className="flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={`/${token}/os/${l.numero}`}
                  className="text-primary text-lg font-semibold underline-offset-4 hover:underline"
                >
                  #{l.numero}
                </Link>
                <span>{l.clienteNome}</span>
                <span className="text-muted-foreground text-sm">
                  {formatBRL(l.valorCobradoCentavos)} · {l.diasDesdeTerminal}{" "}
                  dias desde {LABEL_TERMINAL[l.status] ?? l.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">
                  {formatarTelefoneSimples(l.clienteTelefone)}
                </span>
                <a
                  href={`tel:+55${l.clienteTelefone}`}
                  aria-label={`Ligar para ${l.clienteNome}`}
                  className="text-primary hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md"
                >
                  <Phone className="size-5" />
                </a>
                <a
                  href={`https://wa.me/55${l.clienteTelefone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp de ${l.clienteNome}`}
                  className="text-primary hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md"
                >
                  <MessageCircle className="size-5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
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
