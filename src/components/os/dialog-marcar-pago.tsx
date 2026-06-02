"use client";

// Dialog de Pagamento (FR-10 / Story 2.4). Registra Valor, Estado e Forma —
// dimensão independente do Status. Espelha o idiom do Dialog booleano das
// stories 2.3 (`dialogAberto` + `onOpenChange` bloqueando durante isPending +
// erro inline), acrescentando os campos do formulário.
//
// Decisões (divergências documentadas da AC original, consistentes com 2.1–2.3):
//   - SEM o componente RadioGroup do shadcn (não instalado) — segmented
//     control de `<Button>` (zero dep, touch ≥44px, a11y via role radiogroup
//     + aria-checked).
//   - SEM `useOptimistic`/Toaster — o badge vem do Server Component pai;
//     sucesso fecha o dialog e `router.refresh()` re-renderiza. Erro inline.
//   - `requestId` lazy via useState; regenera após sucesso.

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrarPagamento } from "@/lib/actions/registrar-pagamento.action";
import type { EstadoPagamento, FormaPagamento } from "@/lib/domain/pagamento";
import { formatBRL, reaisParaCentavos } from "@/lib/format/moeda";

const ESTADO_OPCOES: { valor: EstadoPagamento; label: string }[] = [
  { valor: "Pago", label: "Pago" },
  { valor: "Pendente", label: "Pendente" },
  { valor: "Sem_cobranca", label: "Sem cobrança" },
];

const FORMA_OPCOES: { valor: FormaPagamento; label: string }[] = [
  { valor: "PIX", label: "PIX" },
  { valor: "Dinheiro", label: "Dinheiro" },
  { valor: "Cartao", label: "Cartão" },
];

export function DialogMarcarPago({
  numero,
  valorAtualCentavos,
  estadoAtual,
  formaAtual,
}: {
  numero: number;
  valorAtualCentavos: number | null;
  estadoAtual: EstadoPagamento;
  formaAtual: FormaPagamento | null;
}) {
  const [requestId, setRequestId] = useState<string>(() => crypto.randomUUID());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [valorStr, setValorStr] = useState<string>(
    valorAtualCentavos !== null ? formatBRL(valorAtualCentavos) : "",
  );
  const [estado, setEstado] = useState<EstadoPagamento>(estadoAtual);
  const [forma, setForma] = useState<FormaPagamento | null>(formaAtual);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const nadaPreenchido =
    valorAtualCentavos === null && estadoAtual === "Sem_cobranca";

  function abrir() {
    // Resetar campos para os valores atuais ao (re)abrir.
    setValorStr(valorAtualCentavos !== null ? formatBRL(valorAtualCentavos) : "");
    setEstado(estadoAtual);
    setForma(formaAtual);
    setMensagemErro(null);
    setDialogAberto(true);
  }

  function selecionarEstado(novo: EstadoPagamento) {
    setEstado(novo);
    // Forma só vale com Pago — limpar ao sair de Pago.
    if (novo !== "Pago") {
      setForma(null);
    }
  }

  function onSalvar() {
    setMensagemErro(null);

    let valorCobradoCentavos: number | null = null;
    if (valorStr.trim() !== "") {
      try {
        valorCobradoCentavos = reaisParaCentavos(valorStr);
      } catch {
        setMensagemErro("Valor inválido");
        return;
      }
    }

    // Guard cliente espelhando o superRefine do schema.
    if (estado === "Pago" && forma === null) {
      setMensagemErro("Selecione a forma de pagamento");
      return;
    }

    startTransition(async () => {
      const result = await registrarPagamento({
        numero,
        valorCobradoCentavos,
        estadoPagamento: estado,
        formaPagamento: estado === "Pago" ? forma : null,
        requestId,
      });

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
              : "Erro ao salvar pagamento. Tente novamente.";
      setMensagemErro(mensagem);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={abrir}
        className="min-h-[44px] self-start"
      >
        {nadaPreenchido ? "Registrar pagamento" : "Editar pagamento"}
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
            <DialogTitle>Pagamento da OS #{numero}</DialogTitle>
            <DialogDescription>
              Valor, estado e forma de pagamento — independentes do status da
              OS.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor-cobrado">Valor cobrado</Label>
              <Input
                id="valor-cobrado"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Estado do pagamento</Label>
              <div
                role="radiogroup"
                aria-label="Estado do pagamento"
                className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
              >
                {ESTADO_OPCOES.map((opcao) => (
                  <Button
                    key={opcao.valor}
                    type="button"
                    role="radio"
                    aria-checked={estado === opcao.valor}
                    variant={estado === opcao.valor ? "default" : "outline"}
                    onClick={() => selecionarEstado(opcao.valor)}
                    className="min-h-[44px]"
                  >
                    {opcao.label}
                  </Button>
                ))}
              </div>
            </div>

            {estado === "Pago" ? (
              <div className="flex flex-col gap-2">
                <Label>Forma de pagamento</Label>
                <div
                  role="radiogroup"
                  aria-label="Forma de pagamento"
                  className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
                >
                  {FORMA_OPCOES.map((opcao) => (
                    <Button
                      key={opcao.valor}
                      type="button"
                      role="radio"
                      aria-checked={forma === opcao.valor}
                      variant={forma === opcao.valor ? "default" : "outline"}
                      onClick={() => setForma(opcao.valor)}
                      className="min-h-[44px]"
                    >
                      {opcao.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {mensagemErro ? (
              <p role="alert" className="text-destructive text-sm">
                {mensagemErro}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setDialogAberto(false)}
            >
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={onSalvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
