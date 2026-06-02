import { differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

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
