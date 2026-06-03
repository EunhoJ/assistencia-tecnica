import { db } from "@/lib/db/client";
import { agregarMes, calcularDelta } from "@/lib/domain/financeiro";
import { inicioDoMesSP, proximoMes } from "@/lib/format/data";

// Resumo financeiro mensal (FR-15 / Story 3.4). Total faturado, comparativo com
// o mês anterior e breakdown por Forma de pagamento. Lê as OSs `Pago` cujo
// `pago_em` cai no mês (em SP) via `db.os.findMany` e delega a agregação ao
// domínio puro `agregarMes`/`calcularDelta`.
//
// Decisão (findMany + JS, NÃO groupBy): a extension de soft-delete (db/
// extensions.ts) intercepta apenas findMany/findUnique/findFirst/count/aggregate
// — `groupBy` passaria direto e deixaria OSs deletadas no total. `findMany`
// herda o filtro `deletadoEm: null` automaticamente. Volume pequeno (Pago no
// mês ≪ 5.000) → custo desprezível. Casa o índice parcial idx_os_pago_em__pago.

function mesAnteriorDe(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

async function pagamentosDoMes(ano: number, mes: number) {
  const inicio = inicioDoMesSP(ano, mes);
  const prox = proximoMes(ano, mes);
  const fim = inicioDoMesSP(prox.ano, prox.mes); // half-open [inicio, fim)

  const rows = await db.os.findMany({
    where: { estadoPagamento: "Pago", pagoEm: { gte: inicio, lt: fim } },
    select: { formaPagamento: true, valorCobradoCentavos: true },
  });

  return rows.map((r) => ({
    formaPagamento: r.formaPagamento,
    valorCentavos: r.valorCobradoCentavos,
  }));
}

export async function resumoFinanceiroMensal({
  ano,
  mes,
}: {
  ano: number;
  mes: number;
}) {
  const anterior = mesAnteriorDe(ano, mes);

  const [rowsAtual, rowsAnterior] = await Promise.all([
    pagamentosDoMes(ano, mes),
    pagamentosDoMes(anterior.ano, anterior.mes),
  ]);

  const atual = agregarMes(rowsAtual);
  const anteriorAgg = agregarMes(rowsAnterior);
  const delta = calcularDelta(atual.totalCentavos, anteriorAgg.totalCentavos);

  return {
    ano,
    mes,
    atual,
    mesAnterior: { totalCentavos: anteriorAgg.totalCentavos },
    delta,
  };
}

export type ResumoFinanceiro = Awaited<
  ReturnType<typeof resumoFinanceiroMensal>
>;
