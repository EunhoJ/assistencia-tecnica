import { Badge } from "@/components/ui/badge";
import { $Enums } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type EstadoPagamento = $Enums.EstadoPagamento;

const PAGAMENTO_DISPLAY: Record<
  EstadoPagamento,
  { label: string; className: string }
> = {
  Pago: {
    label: "Pago",
    className:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  },
  Pendente: {
    label: "Pendente",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
  },
  Sem_cobranca: {
    label: "Sem cobrança",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function BadgePagamento({ estado }: { estado: EstadoPagamento }) {
  const { label, className } = PAGAMENTO_DISPLAY[estado];
  return (
    <Badge variant="outline" className={cn(className)}>
      {label}
    </Badge>
  );
}
