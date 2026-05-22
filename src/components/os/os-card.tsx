import Link from "next/link";

import { BadgePagamento } from "@/components/os/badge-pagamento";
import { BadgeStatus } from "@/components/os/badge-status";
import { Card } from "@/components/ui/card";
import type { StatusOs } from "@/lib/domain/status";
import { formatDataHora } from "@/lib/format/data";
import type { OsDashboardRow } from "@/lib/queries/listar-os-dashboard";

// Item do dashboard. Card inteiro é link clicável (alvo de toque ≥44px,
// mobile-first). Mobile: layout em coluna. Desktop (sm+): layout em row.

export function OsCard({ os, token }: { os: OsDashboardRow; token: string }) {
  return (
    <Link
      href={`/${token}/os/${os.numeroSequencial}`}
      aria-label={`Abrir OS #${os.numeroSequencial} de ${os.cliente.nome}`}
      className="block min-h-[44px]"
    >
      <Card className="hover:bg-muted/50 flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:gap-6">
        <div className="sm:w-24">
          <span className="text-3xl font-bold">#{os.numeroSequencial}</span>
        </div>

        <div className="flex-1">
          <p className="font-medium">{os.cliente.nome}</p>
          <p className="text-muted-foreground text-sm">
            {os.aparelhoTipo}
            {os.aparelhoDescricao ? ` — ${os.aparelhoDescricao}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          <BadgeStatus status={os.status as StatusOs} />
          <BadgePagamento estado={os.estadoPagamento} />
        </div>

        <p className="text-muted-foreground text-xs sm:w-32 sm:text-right">
          {formatDataHora(os.criadoEm)}
        </p>
      </Card>
    </Link>
  );
}
