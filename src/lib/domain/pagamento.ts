// Domínio puro de Pagamento da OS. Não importa Prisma/Next/React (pode
// importar `./status`, também puro). Os literais abaixo DEVEM casar com os
// enums `estado_pagamento_enum` e `forma_pagamento_enum` de prisma/schema.prisma
// — mesmo padrão de `StatusOs` em status.ts.
//
// Pagamento é uma dimensão ORTOGONAL ao Status (decisão do PRD): uma OS pode
// estar Entregue e Pendente, ou Cancelado e Pago. Por isso as regras de
// pagamento vivem aqui, separadas das de transição de Status.

import { ehTerminal, type StatusOs } from "./status";

export type EstadoPagamento = "Pago" | "Pendente" | "Sem_cobranca";

export type FormaPagamento = "PIX" | "Dinheiro" | "Cartao";

export function estaPago(os: { estadoPagamento: EstadoPagamento }): boolean {
  return os.estadoPagamento === "Pago";
}

// FR-13 (Epic 3, "Devolvido não pago"): OS em Status terminal cujo Estado de
// pagamento é Pendente e o Valor cobrado é > 0. Fundação de domínio criada
// aqui (com testes) embora o relatório de UI só venha no Epic 3.
export function devolvidoENaoPago(os: {
  status: StatusOs;
  estadoPagamento: EstadoPagamento;
  valorCobradoCentavos: number | null;
}): boolean {
  return (
    ehTerminal(os.status) &&
    os.estadoPagamento === "Pendente" &&
    (os.valorCobradoCentavos ?? 0) > 0
  );
}

// FR-19 (Story 2.7): ao reabrir uma OS que estava Paga, o pai decide o destino
// do pagamento histórico. Função pura (só estado + timestamp; a limpeza de
// `forma_pagamento` é decidida na action conforme o novoEstado).
export type DecisaoPagamento =
  | "manter"
  | "reverter_pendente"
  | "reverter_sem_cobranca";

export function resolverHistoricoPagamento(
  historico: { pagoEm: Date | null },
  decisao: DecisaoPagamento,
): { novoEstado: EstadoPagamento; novoPagoEm: Date | null } {
  switch (decisao) {
    case "manter":
      return { novoEstado: "Pago", novoPagoEm: historico.pagoEm };
    case "reverter_pendente":
      return { novoEstado: "Pendente", novoPagoEm: null };
    case "reverter_sem_cobranca":
      return { novoEstado: "Sem_cobranca", novoPagoEm: null };
  }
}
