import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { OsCard } from "@/components/os/os-card";
import { formatDataHora } from "@/lib/format/data";
import { formatarTelefoneSimples } from "@/lib/format/telefone";
import type { HistoricoCliente } from "@/lib/queries/historico-cliente";

// Ficha do Cliente com histórico de OSs (FR-12 / Story 4.2). Server Component —
// só dados + links. Telefone como dois `<a>` puros (tel:/wa.me sem texto —
// "mostra, não age", espelha tabela-devolvido-nao-pago da 3.2). Lista reusa
// `OsCard` (formato canônico). Read-only.

export function FichaCliente({
  token,
  cliente,
  oss,
}: {
  token: string;
  cliente: HistoricoCliente["cliente"];
  oss: HistoricoCliente["oss"];
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{cliente.nome}</h1>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-muted-foreground text-sm">
          {formatarTelefoneSimples(cliente.telefoneNormalizado) ||
            cliente.telefone}
        </span>
        <a
          href={`tel:+55${cliente.telefoneNormalizado}`}
          aria-label={`Ligar para ${cliente.nome}`}
          className="text-primary hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md"
        >
          <Phone className="size-5" />
        </a>
        <a
          href={`https://wa.me/55${cliente.telefoneNormalizado}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp de ${cliente.nome}`}
          className="text-primary hover:bg-muted/50 inline-flex size-11 items-center justify-center rounded-md"
        >
          <MessageCircle className="size-5" />
        </a>
      </div>

      <p className="text-muted-foreground mt-1 text-sm">
        Cliente desde {formatDataHora(cliente.criadoEm, "MM/yyyy")}
      </p>

      <p className="mt-6 mb-3 font-medium">
        {oss.length} {oss.length === 1 ? "OS no histórico" : "OSs no histórico"}
      </p>

      {oss.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center">
          Este Cliente ainda não tem OS visível no sistema.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {oss.map((os) => (
            <li key={os.id}>
              <OsCard os={os} token={token} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/${token}`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar ao dashboard
      </Link>
    </section>
  );
}
