"use client";

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
import { avancarStatus } from "@/lib/actions/avancar-status.action";
import {
  ehTransicaoNaoNatural,
  transicoesValidas,
  type StatusOs,
} from "@/lib/domain/status";

// Labels pt-BR locais — 7 entradas, baixo custo de duplicação com BadgeStatus.
// Defer dedupe (lib/format/status-labels.ts) para 3º caller.
const STATUS_LABEL: Record<StatusOs, string> = {
  Recebido: "Recebido",
  Orcamento: "Orçamento",
  Aguardando_peca: "Aguardando peça",
  Consertado: "Consertado",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
  Sem_solucao: "Sem solução",
};

export function BotaoAvancarStatus({
  numero,
  statusAtual,
}: {
  numero: number;
  statusAtual: StatusOs;
}) {
  const opcoes = transicoesValidas(statusAtual);

  const [requestId, setRequestId] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [dialogProximo, setDialogProximo] = useState<StatusOs | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (opcoes.length === 0) {
    // Status terminal — botões de Reabrir/etc. vêm na Story 2.7.
    return null;
  }

  function executar(paraStatus: StatusOs, confirmado: boolean) {
    setMensagemErro(null);
    startTransition(async () => {
      const result = await avancarStatus({
        numero,
        paraStatus,
        requestId,
        confirmado,
      });

      if (result.ok) {
        setDialogProximo(null);
        // Regenerar requestId após sucesso para liberar próximas rodadas.
        setRequestId(crypto.randomUUID());
        router.refresh();
        return;
      }

      // Falha: extrair mensagem amigável conforme o code do erro.
      const mensagem =
        result.error.code === "CONFLITO"
          ? result.error.mensagem
          : result.error.code === "NAO_ENCONTRADO"
            ? "OS não encontrada"
            : result.error.code === "VALIDACAO"
              ? "Dados inválidos"
              : "Erro ao avançar status. Tente novamente.";
      setMensagemErro(mensagem);
    });
  }

  function onClickBotao(proximo: StatusOs) {
    if (ehTransicaoNaoNatural(statusAtual, proximo)) {
      setMensagemErro(null);
      setDialogProximo(proximo);
      return;
    }
    executar(proximo, false);
  }

  function onConfirmarDialog() {
    if (dialogProximo) {
      executar(dialogProximo, true);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {opcoes.map((proximo) => {
          const naoNatural = ehTransicaoNaoNatural(statusAtual, proximo);
          return (
            <Button
              key={proximo}
              variant={naoNatural ? "outline" : "default"}
              disabled={isPending}
              onClick={() => onClickBotao(proximo)}
              className="min-h-[44px]"
            >
              Avançar para {STATUS_LABEL[proximo]}
            </Button>
          );
        })}
      </div>

      {mensagemErro ? (
        <p role="alert" className="text-destructive text-sm">
          {mensagemErro}
        </p>
      ) : null}

      <Dialog
        open={dialogProximo !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setDialogProximo(null);
            setMensagemErro(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar avanço para{" "}
              {dialogProximo ? STATUS_LABEL[dialogProximo] : ""}
            </DialogTitle>
            <DialogDescription>
              Esta é uma transição não-natural a partir de{" "}
              {STATUS_LABEL[statusAtual]}. Tem certeza?
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
              onClick={() => setDialogProximo(null)}
            >
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={onConfirmarDialog}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
