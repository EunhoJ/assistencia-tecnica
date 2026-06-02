"use client";

// Botão "Cancelar (cliente desistiu)" (FR-8 / Story 2.3). Encerra a OS como
// `Cancelado` a partir de qualquer Status ativo, atrás de um Dialog de
// confirmação (a ação não pode ser revertida exceto via reabertura — 2.7).
//
// Espelha o idiom do `<BotaoAvancarStatus />`, simplificado para UMA ação:
//   - `useState(() => crypto.randomUUID())` lazy para requestId; regenera em
//     sucesso. Estado do dialog é um boolean (não `StatusOs | null`).
//   - `useTransition` + `useRouter().refresh()`. SEM `useOptimistic` (o sucesso
//     re-renderiza a parent com Status terminal → o botão some; otimismo seria
//     redundante). SEM Toaster — erros inline em `<p role="alert">` dentro do
//     Dialog (consistência com 2.1/2.2).
//
// Componente-irmão de `<BotaoSemSolucao />` (FR-9): paralelo intencional.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelarOs } from "@/lib/actions/cancelar-os.action";

export function BotaoCancelar({ numero }: { numero: number }) {
  const [requestId, setRequestId] = useState<string>(() => crypto.randomUUID());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onConfirmar() {
    setMensagemErro(null);
    startTransition(async () => {
      const result = await cancelarOs({ numero, requestId });

      if (result.ok) {
        setRequestId(crypto.randomUUID());
        setDialogAberto(false);
        router.refresh();
        return;
      }

      const mensagem =
        result.error.code === "CONFLITO"
          ? result.error.mensagem
          : result.error.code === "NAO_ENCONTRADO"
            ? "OS não encontrada"
            : result.error.code === "VALIDACAO"
              ? "Dados inválidos"
              : "Erro ao cancelar. Tente novamente.";
      setMensagemErro(mensagem);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setMensagemErro(null);
          setDialogAberto(true);
        }}
        className="min-h-[44px] self-start"
      >
        Cancelar (cliente desistiu)
      </Button>

      <Dialog
        open={dialogAberto}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setDialogAberto(false);
            setMensagemErro(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar OS #{numero}?</DialogTitle>
            <DialogDescription>
              Esta ação encerra a OS e não pode ser revertida exceto via
              reabertura.
            </DialogDescription>
          </DialogHeader>
          {mensagemErro ? (
            <p role="alert" className="text-destructive text-sm">
              {mensagemErro}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setDialogAberto(false)}
            >
              Voltar
            </Button>
            <Button disabled={isPending} onClick={onConfirmar}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
