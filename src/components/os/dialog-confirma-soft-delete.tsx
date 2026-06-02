"use client";

// Dialog de confirmação de exclusão para OS em Status terminal (FR-4 /
// Story 2.6). Controlado pelo `<BotaoExcluirOs />`. Enumera os impactos
// (texto pré-computado no server) antes de confirmar.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DialogConfirmaSoftDelete({
  aberto,
  onOpenChange,
  onConfirmar,
  numero,
  impacto,
  isPending,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirmar: () => void;
  numero: number;
  impacto: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir OS #{numero}?</DialogTitle>
          <DialogDescription>{impacto}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirmar}
          >
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
