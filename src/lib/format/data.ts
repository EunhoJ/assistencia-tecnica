import { differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { TIMEZONE_OFICINA } from "@/lib/constants";

// Formata Date em pt-BR no timezone fixo da oficina (Regra Inegociável 5).
// `formato` segue tokens do date-fns (ex.: "dd/MM/yyyy", "HH:mm", etc.).
// Default: "dd/MM/yyyy HH:mm".
export function formatDataHora(date: Date, formato: string = "dd/MM/yyyy HH:mm"): string {
  return formatInTimeZone(date, TIMEZONE_OFICINA, formato);
}

// Dias de CALENDÁRIO completos entre dois instantes, contados no timezone da
// oficina (Story 3.2 / FR-13). Conta por virada de meia-noite em São Paulo —
// uma OS terminada às 23h59 de ontem conta como 1 dia hoje de manhã, não 0.
// Primitivo puro reusado pela Story 3.3 (diasParados).
export function calcularDiasCorridos(de: Date, ate: Date): number {
  return differenceInCalendarDays(
    toZonedTime(ate, TIMEZONE_OFICINA),
    toZonedTime(de, TIMEZONE_OFICINA),
  );
}

// ============================================================================
// Helpers de mês no fuso da oficina (Story 3.4 / FR-15 — Resumo financeiro).
// A atribuição de um pagamento a um mês depende do timestamp em São Paulo,
// não em UTC (a Vercel roda em UTC). Tudo aqui calcula via SP.
// ============================================================================

// Ano + mês (mes 1-12) do instante `agora` no fuso da oficina. Lê os campos
// formatados em SP — NUNCA `getMonth()` do host (timezone do servidor é UTC).
export function mesCorrenteSP(agora: Date): { ano: number; mes: number } {
  const ano = Number(formatInTimeZone(agora, TIMEZONE_OFICINA, "yyyy"));
  const mes = Number(formatInTimeZone(agora, TIMEZONE_OFICINA, "MM"));
  return { ano, mes };
}

// Instante UTC do primeiro milissegundo do mês {ano, mes} (mes 1-12) em SP.
// Use com `lt: inicioDoMesSP(proximoMes(...))` para janela half-open
// [inicio, fim) — evita o gap de milissegundos de um `lte 23:59:59.999`.
// `fromZonedTime` (date-fns-tz v3) interpreta a string wall-clock como horário
// de São Paulo e devolve o instante UTC correspondente.
export function inicioDoMesSP(ano: number, mes: number): Date {
  const mm = String(mes).padStart(2, "0");
  return fromZonedTime(`${ano}-${mm}-01T00:00:00`, TIMEZONE_OFICINA);
}

// Próximo mês, tratando rollover de dezembro.
export function proximoMes(
  ano: number,
  mes: number,
): { ano: number; mes: number } {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

// "Maio 2026" — mês capitalizado em pt-BR + ano. Array constante (sem
// Intl/toLocaleString/locale) para saída determinística — mesma filosofia de
// `moeda.ts:formatBRL`.
const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function formatMesAno(ano: number, mes: number): string {
  return `${MESES_PT[mes - 1]} ${ano}`;
}
