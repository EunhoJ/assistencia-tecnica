import { formatInTimeZone } from "date-fns-tz";

import { TIMEZONE_OFICINA } from "@/lib/constants";

// Formata Date em pt-BR no timezone fixo da oficina (Regra Inegociável 5).
// `formato` segue tokens do date-fns (ex.: "dd/MM/yyyy", "HH:mm", etc.).
// Default: "dd/MM/yyyy HH:mm".
export function formatDataHora(date: Date, formato: string = "dd/MM/yyyy HH:mm"): string {
  return formatInTimeZone(date, TIMEZONE_OFICINA, formato);
}
