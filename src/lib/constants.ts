// Constantes globais do projeto. Single source of truth — não duplicar
// valores nos lugares que consomem.

export const RATE_LIMIT_REQUESTS = 60;
export const RATE_LIMIT_WINDOW_S = 60;

// FR-18: valor default do limiar de dias parados. Espelha o @default(30)
// do Config.limiarDiasParados no schema Prisma.
export const LIMIAR_DIAS_PARADOS_DEFAULT = 30;

// Timezone da oficina. Usado por lib/format/data.ts e qualquer cálculo
// de agregação mensal (FR-15).
export const TIMEZONE_OFICINA = "America/Sao_Paulo";

// FR-5: primeiro número de OS emitido pela sequence os_numero_sequencial_seq.
// Mantido aqui para docs/testes; sequence é a fonte real em runtime.
export const NUMERO_OS_INICIAL = 1001;
