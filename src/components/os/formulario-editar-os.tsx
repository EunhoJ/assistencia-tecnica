"use client";

// Formulário de edição de campos descritivos (FR-3 / Story 2.5). Espelha o
// `formulario-nova-os.tsx`, MAS sem autocomplete: o Cliente já existe, então
// Nome/Telefone são <Input> simples. Editar nome/telefone atualiza o registro
// do Cliente compartilhado (afeta todas as OSs dele) — nota visível na tela.

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editarOs } from "@/lib/actions/editar-os.action";
import { editarOsSchema } from "@/lib/schemas/os.schema";

// Form sem `requestId`/`numero` (injetados no submit).
const formSchema = editarOsSchema.omit({ requestId: true, numero: true });
type FormValues = z.input<typeof formSchema>;

export function FormularioEditarOs({
  numero,
  valoresIniciais,
}: {
  numero: number;
  valoresIniciais: FormValues;
}) {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [isPending, startTransition] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: valoresIniciais,
  });

  const onSubmit = (data: FormValues) => {
    setErroGeral(null);
    startTransition(async () => {
      const result = await editarOs({ ...data, numero, requestId });

      if (result.ok) {
        router.push(`/${params.token}/os/${numero}`);
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
        <p className="text-muted-foreground -mt-1 mb-1 text-xs">
          Alterar nome/telefone atualiza o cadastro do Cliente (afeta todas as
          OSs dele).
        </p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-nome">Nome</Label>
          <Input
            id="cliente-nome"
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
            autoComplete="off"
            inputMode="tel"
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          rows={3}
          {...form.register("observacoes")}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-[44px] px-8 sm:self-start"
        >
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        <Link
          href={`/${params.token}/os/${numero}`}
          className="text-primary inline-flex min-h-[44px] items-center underline-offset-4 hover:underline"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
