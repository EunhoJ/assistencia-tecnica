// Domínio puro de agregações financeiras mensais (Story 3.4 / FR-15 — Resumo
// financeiro). Não importa Prisma/Next/React (pode importar `./pagamento`,
// também puro). A query (`lib/queries/resumo-financeiro-mensal.ts`) lê as OSs
// `Pago` do mês via `db.os.findMany` e delega a soma/breakdown para cá.

import type { FormaPagamento } from "./pagamento";

export type BreakdownForma = {
  centavos: number;
  count: number;
  percentual: number;
};

export type AgregadoMes = {
  totalCentavos: number;
  qtdOss: number;
  // Chaves SEMPRE presentes (PIX/Dinheiro/Cartao), zeradas se não houver.
  breakdown: Record<FormaPagamento, BreakdownForma>;
};

const FORMAS: FormaPagamento[] = ["PIX", "Dinheiro", "Cartao"];

// Arredonda para 1 casa decimal (ex.: 18.42 → 18.4).
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Agrega as OSs `Pago` de um mês em total + breakdown por Forma de pagamento.
// `valorCentavos` pode ser null (o schema permite valor NULL mesmo em `Pago`);
// tratado como 0 — nunca `NaN`. `percentual` é relativo ao total do mês, com
// guarda de divisão por zero.
export function agregarMes(
  rows: { formaPagamento: FormaPagamento | null; valorCentavos: number | null }[],
): AgregadoMes {
  const breakdown: Record<FormaPagamento, BreakdownForma> = {
    PIX: { centavos: 0, count: 0, percentual: 0 },
    Dinheiro: { centavos: 0, count: 0, percentual: 0 },
    Cartao: { centavos: 0, count: 0, percentual: 0 },
  };

  let totalCentavos = 0;
  for (const row of rows) {
    const v = row.valorCentavos ?? 0;
    totalCentavos += v;
    // Invariante (Story 2.4): `Pago` exige Forma. Defensivo: se vier null,
    // soma no total/qtdOss mas não cria bucket (em prod não deve ocorrer).
    if (row.formaPagamento) {
      breakdown[row.formaPagamento].centavos += v;
      breakdown[row.formaPagamento].count += 1;
    }
  }

  if (totalCentavos > 0) {
    for (const forma of FORMAS) {
      breakdown[forma].percentual = round1(
        (breakdown[forma].centavos / totalCentavos) * 100,
      );
    }
  }

  return { totalCentavos, qtdOss: rows.length, breakdown };
}

// Delta vs o mês anterior. `percentual` é null quando o anterior é 0 (a UI
// mostra "Sem comparativo") — nunca `Infinity`/`NaN`.
export function calcularDelta(
  totalAtual: number,
  totalAnterior: number,
): { absoluto: number; percentual: number | null } {
  const absoluto = totalAtual - totalAnterior;
  const percentual =
    totalAnterior > 0 ? round1((absoluto / totalAnterior) * 100) : null;
  return { absoluto, percentual };
}
