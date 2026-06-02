"use client";

// Botão "Sem solução (não há reparo)" (FR-9 / Story 2.3). Encerra a OS como
// `Sem_solucao` a partir de qualquer Status ativo, atrás de um Dialog de
// confirmação. Distingue de `Cancelado` (decisão do cliente) na descrição.
//
// Componente-irmão de `<BotaoCancelar />` (FR-8): estrutura idêntica, difere
// só na action, labels e textos do Dialog. Mesmas decisões: requestId lazy +
// regenera em sucesso, `useTransition` + `router.refresh()`, sem
// `useOptimistic`/Toaster, erro inline no Dialog. Duplicação intencional.

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
import { semSolucaoOs } from "@/lib/actions/sem-solucao-os.action";

export function BotaoSemSolucao({ numero }: { numero: number }) {
  const [requestId, setRequestId] = useState<string>(() => crypto.randomUUID());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onConfirmar() {
    setMensagemErro(null);
    startTransition(async () => {
      const result = await semSolucaoOs({ numero, requestId });

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
              : "Erro ao marcar 'Sem solução'. Tente novamente.";
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
        Sem solução (não há reparo)
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
            <DialogTitle>Marcar OS #{numero} como &quot;Sem solução&quot;?</DialogTitle>
            <DialogDescription>
              Diferente de &quot;Cancelado&quot; (decisão do cliente), &quot;Sem
              solução&quot; indica desistência técnica.
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
