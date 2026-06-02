"use client";

// Botão "Restaurar" de uma OS na Lixeira (FR-4 / Story 2.6). Chama a action
// `restaurarOs` e, em sucesso, dá refresh (a linha some da Lixeira). Feedback
// via sonner.

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { restaurarOs } from "@/lib/actions/restaurar-os.action";

export function BotaoRestaurar({ numero }: { numero: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
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

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={onClick}
      className="min-h-[44px]"
    >
      Restaurar
    </Button>
  );
}
