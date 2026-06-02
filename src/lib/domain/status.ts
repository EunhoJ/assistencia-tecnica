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

// ============================================================================
// Transições (Story 2.1)
//
// Tabelas explícitas — fluxo `Recebido → Orçamento → Aguardando peça →
// Consertado → Entregue`. Transições NÃO-NATURAIS (pular passos) são
// permitidas com confirmação do operador. Cancelado/Sem_solucao NÃO
// aparecem em nenhuma tabela — esses terminais são acessados por actions
// dedicadas (Story 2.3), não pelo fluxo de avanço.
// ============================================================================

export const TRANSICOES_NATURAIS: Readonly<Record<StatusOs, readonly StatusOs[]>> = {
  Recebido: ["Orcamento"],
  Orcamento: ["Aguardando_peca"],
  Aguardando_peca: ["Consertado"],
  Consertado: ["Entregue"],
  Entregue: [],
  Cancelado: [],
  Sem_solucao: [],
};

export const TRANSICOES_NAO_NATURAIS: Readonly<
  Record<StatusOs, readonly StatusOs[]>
> = {
  Recebido: ["Aguardando_peca", "Consertado"],
  Orcamento: ["Consertado"],
  Aguardando_peca: ["Entregue"],
  Consertado: [],
  Entregue: [],
  Cancelado: [],
  Sem_solucao: [],
};

export function podeTransicionar(de: StatusOs, para: StatusOs): boolean {
  return (
    TRANSICOES_NATURAIS[de].includes(para) ||
    TRANSICOES_NAO_NATURAIS[de].includes(para)
  );
}

export function transicoesValidas(de: StatusOs): StatusOs[] {
  return [...TRANSICOES_NATURAIS[de], ...TRANSICOES_NAO_NATURAIS[de]];
}

export function ehTransicaoNaoNatural(de: StatusOs, para: StatusOs): boolean {
  return TRANSICOES_NAO_NATURAIS[de].includes(para);
}

// FR-7: sair de Orçamento rumo a Aguardando peça ou Consertado exige
// aprovação registrada (`aprovado_em` preenchido). Centralizar a regra aqui
// permite que tanto `avancarStatus` quanto telas (Story 2.2+) consultem o
// mesmo predicado.
export function exigeAprovacao(de: StatusOs, para: StatusOs): boolean {
  return de === "Orcamento" && (para === "Aguardando_peca" || para === "Consertado");
}

// FR-19 (Story 2.7): reabrir uma OS terminal exige um destino ATIVO. A regra
// é só "de terminal para ativo" — o fluxo dedicado de reabertura é o único
// canal que sai de um terminal sem ser via `restaurarOs` (soft-delete).
export function podeReabrirPara(deTerminal: StatusOs, paraAtivo: StatusOs): boolean {
  return ehTerminal(deTerminal) && ehAtivo(paraAtivo);
}
