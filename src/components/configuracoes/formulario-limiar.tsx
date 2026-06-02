"use client";

// Formulário do Limiar de dias parados (FR-18 / Story 3.1). RHF + Zod resolver
// (espelha formulario-nova-os.tsx), campo numérico único. Feedback via sonner
// (Story 2.6): toast "Salvo" em sucesso, toast de erro em falha. Sem
// useOptimistic (consistência com 1.5–2.7).

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { atualizarConfig } from "@/lib/actions/atualizar-config.action";
import { atualizarConfigSchema } from "@/lib/schemas/config.schema";

const formSchema = atualizarConfigSchema.omit({ requestId: true });
type FormValues = z.input<typeof formSchema>;

export function FormularioLimiar({ valorAtual }: { valorAtual: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { limiarDiasParados: valorAtual },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await atualizarConfig({ ...data, requestId });

      if (result.ok) {
        toast.success("Salvo");
        setRequestId(crypto.randomUUID());
        router.refresh();
        return;
      }

      if (result.error.code === "VALIDACAO") {
        for (const [campo, msg] of Object.entries(result.error.campos)) {
          form.setError(campo as keyof FormValues, {
            type: "server",
            message: msg,
          });
        }
        return;
      }

      toast.error(
        "mensagem" in result.error
          ? result.error.mensagem
          : "Erro ao salvar. Tente novamente.",
      );
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <Label htmlFor="limiar">Considerar parado após:</Label>
      <div className="flex items-center gap-2">
        <Input
          id="limiar"
          type="number"
          min={1}
          max={365}
          inputMode="numeric"
          aria-invalid={Boolean(form.formState.errors.limiarDiasParados)}
          className="min-h-[44px] w-28"
          {...form.register("limiarDiasParados", { valueAsNumber: true })}
        />
        <span className="text-muted-foreground">dias</span>
      </div>
      {form.formState.errors.limiarDiasParados ? (
        <p className="text-destructive text-sm">
          {form.formState.errors.limiarDiasParados.message}
        </p>
      ) : null}
      <p className="text-muted-foreground text-sm">
        Dias em que uma OS ativa pode ficar no mesmo Status antes de aparecer no
        relatório de Aparelhos parados.
      </p>
      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="min-h-[44px] self-start px-6"
      >
        {isPending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
