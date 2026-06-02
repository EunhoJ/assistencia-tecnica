import { Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BadgePagamento } from "@/components/os/badge-pagamento";
import { BadgeStatus } from "@/components/os/badge-status";
import { BotaoAvancarStatus } from "@/components/os/botao-avancar-status";
import { BotaoCancelar } from "@/components/os/botao-cancelar";
import { BotaoMarcarAprovado } from "@/components/os/botao-marcar-aprovado";
import { BotaoSemSolucao } from "@/components/os/botao-sem-solucao";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ehAtivo, type StatusOs } from "@/lib/domain/status";
import { formatDataHora } from "@/lib/format/data";
import { formatBRL } from "@/lib/format/moeda";
import { formatarTelefoneSimples } from "@/lib/format/telefone";
import { buscarOsPorNumero } from "@/lib/queries/buscar-os-por-numero";

// Mapping inline da FormaPagamento (3 valores; util dedicado seria
// over-engineering para v1).
function labelFormaPagamento(f: string | null): string {
  if (!f) return "—";
  if (f === "Cartao") return "Cartão";
  return f;
}

export default async function OsDetalhePage({
  params,
}: {
  params: Promise<{ token: string; numero: string }>;
}) {
  const { token, numero: numeroStr } = await params;
  const numero = Number(numeroStr);

  if (!Number.isInteger(numero) || numero <= 0) {
    notFound();
  }

  const os = await buscarOsPorNumero(numero);
  if (!os) {
    notFound();
  }

  const telefoneFormatado =
    formatarTelefoneSimples(os.cliente.telefoneNormalizado) ||
    os.cliente.telefone;

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl">
        OS #{os.numeroSequencial}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-lg">{os.cliente.nome}</p>
            <a
              href={`tel:${os.cliente.telefoneNormalizado}`}
              aria-label={`Ligar para ${os.cliente.nome}`}
              className="text-primary hover:bg-muted/50 flex min-h-[44px] items-center gap-2 self-start rounded-md px-2 -mx-2 underline-offset-4 hover:underline"
            >
              <Phone className="size-4" />
              {telefoneFormatado}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparelho</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{os.aparelhoTipo}</p>
            {os.aparelhoDescricao ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {os.aparelhoDescricao}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Defeito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{os.defeitoRelatado}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BadgeStatus
              status={os.status as StatusOs}
              className="text-base px-3 py-1"
            />
            <p className="text-muted-foreground text-xs">
              Alterado em {formatDataHora(os.statusAlteradoEm)}
            </p>
            <BotaoAvancarStatus
              numero={os.numeroSequencial}
              statusAtual={os.status as StatusOs}
            />
            {os.status === "Orcamento" || os.aprovadoEm ? (
              <div className="flex flex-col gap-2 border-t pt-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Aprovação: </span>
                  {os.aprovadoEm ? (
                    <span>aprovada em {formatDataHora(os.aprovadoEm)}</span>
                  ) : (
                    <span>pendente</span>
                  )}
                </div>
                {os.status === "Orcamento" && os.aprovadoEm === null ? (
                  <BotaoMarcarAprovado numero={os.numeroSequencial} />
                ) : null}
              </div>
            ) : null}
            {ehAtivo(os.status as StatusOs) ? (
              <div className="flex flex-col gap-2 border-t pt-3">
                <p className="text-muted-foreground text-xs">Ações de exceção</p>
                <BotaoCancelar numero={os.numeroSequencial} />
                <BotaoSemSolucao numero={os.numeroSequencial} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <BadgePagamento estado={os.estadoPagamento} />
            <div className="mt-2 flex flex-col gap-1">
              <div>
                <span className="text-muted-foreground">Valor: </span>
                <span>
                  {os.valorCobradoCentavos !== null
                    ? formatBRL(os.valorCobradoCentavos)
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Forma: </span>
                <span>{labelFormaPagamento(os.formaPagamento)}</span>
              </div>
              {os.pagoEm ? (
                <div>
                  <span className="text-muted-foreground">Pago em: </span>
                  <span>{formatDataHora(os.pagoEm)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Datas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>
              <span className="text-muted-foreground">Criada em: </span>
              <span>{formatDataHora(os.criadoEm)}</span>
            </div>
          </CardContent>
        </Card>

        {os.observacoes ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{os.observacoes}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Link
        href={`/${token}/`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar ao dashboard
      </Link>
    </section>
  );
}
