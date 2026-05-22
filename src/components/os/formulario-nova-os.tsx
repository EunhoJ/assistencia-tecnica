"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarOs } from "@/lib/actions/criar-os.action";
import { criarOsSchema } from "@/lib/schemas/os.schema";

// Tipo do form: usa z.input do schema (sem requestId), porque `aparelho.descricao`
// tem .default("") — input é opcional, output é obrigatório. RHF trabalha com
// o tipo de input do resolver.
const formSchema = criarOsSchema.omit({ requestId: true });
type FormValues = z.input<typeof formSchema>;

export function FormularioNovaOs() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [isPending, startTransition] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Lazy init garante UUID único por montagem; persiste através de re-renders
  // até navegação. Idempotência preservada mesmo se o usuário re-submeter.
  const [requestId] = useState(() => crypto.randomUUID());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: { nome: "", telefone: "" },
      aparelho: { tipo: "", descricao: "" },
      defeitoRelatado: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    setErroGeral(null);
    startTransition(async () => {
      const result = await criarOs({ ...data, requestId });

      if (result.ok) {
        router.push(`/${params.token}/os/${result.data.numero}`);
        return;
      }

      if (result.error.code === "VALIDACAO") {
        for (const [campo, msg] of Object.entries(result.error.campos)) {
          // ZodError.flatten() agrega no top-level por chave do schema.
          // Como nossos campos top-level são "cliente", "aparelho",
          // "defeitoRelatado", as chaves cabem em FormValues.
          form.setError(campo as keyof FormValues, {
            type: "server",
            message: msg,
          });
        }
        return;
      }

      // CONFLITO | NAO_ENCONTRADO | INTERNO
      const mensagem =
        "mensagem" in result.error ? result.error.mensagem : "Erro inesperado.";
      setErroGeral(mensagem);
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {erroGeral ? (
        <div
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm"
        >
          {erroGeral}
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-base font-semibold">Cliente</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-nome">Nome</Label>
          <Input
            id="cliente-nome"
            autoFocus
            autoComplete="off"
            aria-invalid={Boolean(form.formState.errors.cliente?.nome)}
            className="min-h-[44px]"
            {...form.register("cliente.nome")}
          />
          {form.formState.errors.cliente?.nome ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.cliente.nome.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-telefone">Telefone</Label>
          <Input
            id="cliente-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            aria-invalid={Boolean(form.formState.errors.cliente?.telefone)}
            className="min-h-[44px]"
            {...form.register("cliente.telefone")}
          />
          {form.formState.errors.cliente?.telefone ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.cliente.telefone.message}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-base font-semibold">Aparelho</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="aparelho-tipo">Tipo</Label>
          <Input
            id="aparelho-tipo"
            autoComplete="off"
            aria-invalid={Boolean(form.formState.errors.aparelho?.tipo)}
            className="min-h-[44px]"
            {...form.register("aparelho.tipo")}
          />
          {form.formState.errors.aparelho?.tipo ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.aparelho.tipo.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="aparelho-descricao">Descrição (opcional)</Label>
          <Textarea
            id="aparelho-descricao"
            rows={2}
            {...form.register("aparelho.descricao")}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="defeito">Defeito relatado</Label>
        <Textarea
          id="defeito"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.defeitoRelatado)}
          {...form.register("defeitoRelatado")}
        />
        {form.formState.errors.defeitoRelatado ? (
          <p className="text-destructive text-sm">
            {form.formState.errors.defeitoRelatado.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        aria-busy={isPending}
        className="min-h-[44px] self-start px-8"
      >
        {isPending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
