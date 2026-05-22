"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { AutocompleteClienteNome } from "@/components/cliente/autocomplete-cliente-nome";
import { AutocompleteClienteTelefone } from "@/components/cliente/autocomplete-cliente-telefone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClienteSugestao } from "@/lib/actions/buscar-clientes.action";
import { criarOs } from "@/lib/actions/criar-os.action";
import { criarOsSchema } from "@/lib/schemas/os.schema";

// Tipo do form: usa z.input do schema (sem requestId nem clienteIdSelecionado,
// que são injetados pelo wrapper no submit).
const formSchema = criarOsSchema.omit({ requestId: true, clienteIdSelecionado: true });
type FormValues = z.input<typeof formSchema>;

export function FormularioNovaOs() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [isPending, startTransition] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Lazy init garante UUID único por montagem; persiste através de re-renders
  // até navegação. Idempotência preservada mesmo se o usuário re-submeter.
  const [requestId] = useState(() => crypto.randomUUID());

  // Cliente selecionado via autocomplete (Story 1.6). null = pai digitou
  // novo Cliente (fallback findFirst+create).
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: { nome: "", telefone: "" },
      aparelho: { tipo: "", descricao: "" },
      defeitoRelatado: "",
    },
  });

  // useWatch é o pattern oficial do RHF v7+ para subscribir a um campo
  // específico (React Compiler-friendly; form.watch() retorna função não
  // memoizável e gera warning).
  const clienteNome = useWatch({ control: form.control, name: "cliente.nome" });
  const clienteTelefone = useWatch({
    control: form.control,
    name: "cliente.telefone",
  });

  function aplicarClienteSelecionado(cliente: ClienteSugestao) {
    form.setValue("cliente.nome", cliente.nome, { shouldValidate: true });
    form.setValue("cliente.telefone", cliente.telefone, { shouldValidate: true });
    setClienteIdSelecionado(cliente.id);
  }

  function limparSelecao() {
    setClienteIdSelecionado(null);
  }

  const onSubmit = (data: FormValues) => {
    setErroGeral(null);
    startTransition(async () => {
      const result = await criarOs({
        ...data,
        requestId,
        clienteIdSelecionado: clienteIdSelecionado ?? undefined,
      });

      if (result.ok) {
        router.push(`/${params.token}/os/${result.data.numero}`);
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-nome">Nome</Label>
          <AutocompleteClienteNome
            id="cliente-nome"
            value={clienteNome ?? ""}
            onChange={(v) => form.setValue("cliente.nome", v, { shouldValidate: true })}
            onClienteSelecionado={aplicarClienteSelecionado}
            onClienteDesselecionado={limparSelecao}
            autoFocus
            aria-invalid={Boolean(form.formState.errors.cliente?.nome)}
          />
          {form.formState.errors.cliente?.nome ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.cliente.nome.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-telefone">Telefone</Label>
          <AutocompleteClienteTelefone
            id="cliente-telefone"
            value={clienteTelefone ?? ""}
            onChange={(v) => form.setValue("cliente.telefone", v, { shouldValidate: true })}
            onClienteSelecionado={aplicarClienteSelecionado}
            onClienteDesselecionado={limparSelecao}
            aria-invalid={Boolean(form.formState.errors.cliente?.telefone)}
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
