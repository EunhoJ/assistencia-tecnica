"use client";

// Formulário de reabertura (FR-19 / Story 2.7). Dois passos com escolha
// EXPLÍCITA (sem default silencioso): (1) Status ativo destino; (2) destino do
// pagamento histórico — só quando a OS tinha pagamento concretizado. Segmented
// control de `<Button>` (idiom da 2.4, sem radio-group). Navega ao detalhe em
// sucesso; erros inline.

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reabrirOs } from "@/lib/actions/reabrir-os.action";
import type { DecisaoPagamento } from "@/lib/domain/pagamento";
import type { ReabrirOsInputForm } from "@/lib/schemas/os.schema";

// Só os 4 Status ativos são destino válido (tipo derivado do schema).
type StatusAtivo = ReabrirOsInputForm["paraStatus"];

const STATUS_OPCOES: { valor: StatusAtivo; label: string }[] = [
  { valor: "Recebido", label: "Recebido" },
  { valor: "Orcamento", label: "Orçamento" },
  { valor: "Aguardando_peca", label: "Aguardando peça" },
  { valor: "Consertado", label: "Consertado" },
];

const DECISAO_OPCOES: { valor: DecisaoPagamento; label: string; ajuda: string }[] =
  [
    {
      valor: "manter",
      label: "Manter pagamento",
      ajuda: "O Resumo financeiro do mês original permanece intocado.",
    },
    {
      valor: "reverter_pendente",
      label: "Reverter para Pendente",
      ajuda: "Volta como dívida potencial; o Resumo financeiro recomputa.",
    },
    {
      valor: "reverter_sem_cobranca",
      label: "Reverter para Sem cobrança",
      ajuda: "O pagamento desaparece, sem impacto residual.",
    },
  ];

export function FormularioReabrirOs({
  numero,
  tinhaPago,
  pagamentoResumo,
}: {
  numero: number;
  tinhaPago: boolean;
  pagamentoResumo: string | null;
}) {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [requestId] = useState(() => crypto.randomUUID());
  const [paraStatus, setParaStatus] = useState<StatusAtivo | null>(null);
  const [decisao, setDecisao] = useState<DecisaoPagamento | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onReabrir() {
    setErroGeral(null);

    if (paraStatus === null) {
      setErroGeral("Escolha o status de destino.");
      return;
    }
    if (tinhaPago && decisao === null) {
      setErroGeral("Escolha o que fazer com o pagamento.");
      return;
    }

    startTransition(async () => {
      const result = await reabrirOs({
        numero,
        paraStatus,
        decisaoPagamento: tinhaPago ? decisao! : undefined,
        requestId,
      });

      if (result.ok) {
        router.push(`/${params.token}/os/${numero}`);
        return;
      }

      if (result.error.code === "VALIDACAO") {
        setErroGeral(
          result.error.campos.decisaoPagamento ?? "Dados inválidos.",
        );
        return;
      }
      setErroGeral(
        "mensagem" in result.error
          ? result.error.mensagem
          : "Erro ao reabrir. Tente novamente.",
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {erroGeral ? (
        <div
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm"
        >
          {erroGeral}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Status de destino</Label>
        <div
          role="radiogroup"
          aria-label="Status de destino"
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        >
          {STATUS_OPCOES.map((opcao) => (
            <Button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={paraStatus === opcao.valor}
              variant={paraStatus === opcao.valor ? "default" : "outline"}
              onClick={() => setParaStatus(opcao.valor)}
              className="min-h-[44px]"
            >
              {opcao.label}
            </Button>
          ))}
        </div>
      </div>

      {tinhaPago ? (
        <div className="flex flex-col gap-2">
          <Label>Pagamento histórico</Label>
          {pagamentoResumo ? (
            <p className="text-muted-foreground text-sm">{pagamentoResumo}</p>
          ) : null}
          <div
            role="radiogroup"
            aria-label="Pagamento histórico"
            className="flex flex-col gap-2"
          >
            {DECISAO_OPCOES.map((opcao) => (
              <Button
                key={opcao.valor}
                type="button"
                role="radio"
                aria-checked={decisao === opcao.valor}
                variant={decisao === opcao.valor ? "default" : "outline"}
                onClick={() => setDecisao(opcao.valor)}
                className="h-auto min-h-[44px] flex-col items-start gap-1 py-2 text-left"
              >
                <span className="font-medium">{opcao.label}</span>
                <span className="text-xs font-normal opacity-80">
                  {opcao.ajuda}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="lg"
          disabled={isPending}
          aria-busy={isPending}
          onClick={onReabrir}
          className="min-h-[44px] px-8 sm:self-start"
        >
          {isPending ? "Reabrindo…" : "Reabrir"}
        </Button>
        <Link
          href={`/${params.token}/os/${numero}`}
          className="text-primary inline-flex min-h-[44px] items-center underline-offset-4 hover:underline"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
