// Domínio puro de Status da OS. Não importa Prisma/Next/React.
// O union literal abaixo DEVE casar exatamente com os valores do enum
// status_os_enum declarado em prisma/schema.prisma — drift entre os dois
// é parcialmente detectado pelo teste de cardinalidade em status.test.ts.

export type StatusOs =
  | "Recebido"
  | "Orcamento"
  | "Aguardando_peca"
  | "Consertado"
  | "Entregue"
  | "Cancelado"
  | "Sem_solucao";

export const STATUS_ATIVOS = [
  "Recebido",
  "Orcamento",
  "Aguardando_peca",
  "Consertado",
] as const satisfies readonly StatusOs[];

export const STATUS_TERMINAIS = [
  "Entregue",
  "Cancelado",
  "Sem_solucao",
] as const satisfies readonly StatusOs[];

export function ehAtivo(s: StatusOs): boolean {
  return (STATUS_ATIVOS as readonly StatusOs[]).includes(s);
}

export function ehTerminal(s: StatusOs): boolean {
  return (STATUS_TERMINAIS as readonly StatusOs[]).includes(s);
}
