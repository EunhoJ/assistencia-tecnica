import { Badge } from "@/components/ui/badge";
import type { StatusOs } from "@/lib/domain/status";
import { cn } from "@/lib/utils";

// Cores semânticas Tailwind WCAG AA (shades 100/800 light, 950/200 dark).
// Cada status tem cor distinta para reconhecimento rápido no dashboard.
const STATUS_DISPLAY: Record<StatusOs, { label: string; className: string }> = {
  Recebido: {
    label: "Recebido",
    className:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  },
  Orcamento: {
    label: "Orçamento",
    className:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
  },
  Aguardando_peca: {
    label: "Aguardando peça",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
  },
  Consertado: {
    label: "Consertado",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  },
  Entregue: {
    label: "Entregue",
    className:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  },
  Cancelado: {
    label: "Cancelado",
    className:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  },
  Sem_solucao: {
    label: "Sem solução",
    className:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  },
};

export function BadgeStatus({ status }: { status: StatusOs }) {
  const { label, className } = STATUS_DISPLAY[status];
  return (
    <Badge variant="outline" className={cn(className)}>
      {label}
    </Badge>
  );
}
