"use client";

// Botão "Excluir" do detalhe (FR-4 / Story 2.6). Dois comportamentos:
//   - Status ATIVO: one-click → soft-delete imediato + toast "Desfazer" (8s) +
//     navega ao dashboard (o detalhe daria 404 após o delete).
//   - Status TERMINAL: abre Dialog enumerando impactos antes de confirmar.
// Feedback via sonner (sucesso/erro/undo). `requestId` lazy, regenera em sucesso.

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { DialogConfirmaSoftDelete } from "@/components/os/dialog-confirma-soft-delete";
import { Button } from "@/components/ui/button";
import { restaurarOs } from "@/lib/actions/restaurar-os.action";
import { softDeleteOs } from "@/lib/actions/soft-delete-os.action";
import { ehAtivo, type StatusOs } from "@/lib/domain/status";

export function BotaoExcluirOs({
  numero,
  statusAtual,
  impactoTerminal,
}: {
  numero: number;
  statusAtual: StatusOs;
  impactoTerminal: string | null;
}) {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function mensagemErro(code: string, fallback: string): string {
    if (code === "CONFLITO") return fallback;
    if (code === "NAO_ENCONTRADO") return "OS não encontrada";
    if (code === "VALIDACAO") return "Dados inválidos";
    return fallback;
  }

  function desfazer() {
    startTransition(async () => {
      const result = await restaurarOs({ numero });
      if (result.ok) {
        toast.success(`OS #${numero} restaurada`);
        router.refresh();
        return;
      }
      toast.error("Não foi possível restaurar a OS.");
    });
  }

  function excluir(confirmado: boolean) {
    startTransition(async () => {
      const result = await softDeleteOs({ numero, confirmado, requestId });

      if (result.ok) {
        setRequestId(crypto.randomUUID());
        setDialogAberto(false);
        toast(`OS #${numero} excluída`, {
          description: "Você pode desfazer.",
          duration: 8000,
          action: { label: "Desfazer", onClick: desfazer },
        });
        router.push(`/${params.token}/`);
        return;
      }

      toast.error(
        mensagemErro(
          result.error.code,
          result.error.code === "CONFLITO"
            ? result.error.mensagem
            : "Erro ao excluir. Tente novamente.",
        ),
      );
    });
  }

  function onClick() {
    if (ehAtivo(statusAtual)) {
      excluir(false);
      return;
    }
    setDialogAberto(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={onClick}
        className="text-destructive hover:text-destructive min-h-[44px] self-start"
      >
        Excluir
      </Button>

      {impactoTerminal !== null ? (
        <DialogConfirmaSoftDelete
          aberto={dialogAberto}
          onOpenChange={(aberto) => {
            if (!aberto && !isPending) setDialogAberto(false);
          }}
          onConfirmar={() => excluir(true)}
          numero={numero}
          impacto={impactoTerminal}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
