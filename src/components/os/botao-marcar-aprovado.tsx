"use client";

// Botão "Marcar Aprovação" (FR-7 / Story 2.2). Espelha o style do
// `<BotaoAvancarStatus />`:
//   - `useState(() => crypto.randomUUID())` lazy para requestId.
//   - `useTransition` + `useRouter().refresh()`; sem `useOptimistic` (o
//     componente desaparece após o sucesso porque a parent re-renderiza
//     com `aprovadoEm` preenchido — otimismo é redundante e exigiria lift
//     state da page; consistência com Story 2.1).
//   - Erros inline em `<p role="alert">`. Sem Toaster (defer; consistência).

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { marcarAprovado } from "@/lib/actions/marcar-aprovado.action";

export function BotaoMarcarAprovado({ numero }: { numero: number }) {
  const [requestId, setRequestId] = useState<string>(() => crypto.randomUUID());
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    setMensagemErro(null);
    startTransition(async () => {
      const result = await marcarAprovado({ numero, requestId });

      if (result.ok) {
        setRequestId(crypto.randomUUID());
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
              : "Erro ao marcar aprovação. Tente novamente.";
      setMensagemErro(mensagem);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={isPending}
        onClick={onClick}
        className="min-h-[44px] self-start"
      >
        Marcar Aprovação
      </Button>

      {mensagemErro ? (
        <p role="alert" className="text-destructive text-sm">
          {mensagemErro}
        </p>
      ) : null}
    </div>
  );
}
