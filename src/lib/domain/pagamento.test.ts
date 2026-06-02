import { describe, it, expect } from "vitest";

import {
  devolvidoENaoPago,
  estaPago,
  resolverHistoricoPagamento,
  type EstadoPagamento,
} from "./pagamento";
import type { StatusOs } from "./status";

describe("pagamento domain", () => {
  describe("estaPago", () => {
    it("true quando estadoPagamento é Pago", () => {
      expect(estaPago({ estadoPagamento: "Pago" })).toBe(true);
    });
    for (const estado of ["Pendente", "Sem_cobranca"] as EstadoPagamento[]) {
      it(`false quando estadoPagamento é ${estado}`, () => {
        expect(estaPago({ estadoPagamento: estado })).toBe(false);
      });
    }
  });

  describe("devolvidoENaoPago", () => {
    it("true: terminal (Cancelado) + Pendente + valor > 0", () => {
      expect(
        devolvidoENaoPago({
          status: "Cancelado",
          estadoPagamento: "Pendente",
          valorCobradoCentavos: 28050,
        }),
      ).toBe(true);
    });
    it("true: terminal (Entregue) + Pendente + valor > 0", () => {
      expect(
        devolvidoENaoPago({
          status: "Entregue",
          estadoPagamento: "Pendente",
          valorCobradoCentavos: 100,
        }),
      ).toBe(true);
    });
    it("false: Status ativo (Consertado) + Pendente + valor > 0", () => {
      expect(
        devolvidoENaoPago({
          status: "Consertado",
          estadoPagamento: "Pendente",
          valorCobradoCentavos: 28050,
        }),
      ).toBe(false);
    });
    it("false: terminal + Pago", () => {
      expect(
        devolvidoENaoPago({
          status: "Entregue",
          estadoPagamento: "Pago",
          valorCobradoCentavos: 28050,
        }),
      ).toBe(false);
    });
    it("false: terminal + Pendente + valor 0", () => {
      expect(
        devolvidoENaoPago({
          status: "Cancelado",
          estadoPagamento: "Pendente",
          valorCobradoCentavos: 0,
        }),
      ).toBe(false);
    });
    it("false: terminal + Pendente + valor null", () => {
      expect(
        devolvidoENaoPago({
          status: "Cancelado",
          estadoPagamento: "Pendente",
          valorCobradoCentavos: null,
        }),
      ).toBe(false);
    });
    it("false: terminal + Sem_cobranca", () => {
      expect(
        devolvidoENaoPago({
          status: "Entregue",
          estadoPagamento: "Sem_cobranca",
          valorCobradoCentavos: 28050,
        }),
      ).toBe(false);
    });
    it("false: todos os Status ativos com Pendente + valor > 0", () => {
      const ativos: StatusOs[] = [
        "Recebido",
        "Orcamento",
        "Aguardando_peca",
        "Consertado",
      ];
      for (const status of ativos) {
        expect(
          devolvidoENaoPago({
            status,
            estadoPagamento: "Pendente",
            valorCobradoCentavos: 5000,
          }),
        ).toBe(false);
      }
    });
  });

  describe("resolverHistoricoPagamento", () => {
    const pagoEm = new Date("2026-05-10T12:00:00Z");

    it("manter → Pago, preserva pagoEm", () => {
      expect(resolverHistoricoPagamento({ pagoEm }, "manter")).toEqual({
        novoEstado: "Pago",
        novoPagoEm: pagoEm,
      });
    });
    it("reverter_pendente → Pendente, pagoEm null", () => {
      expect(
        resolverHistoricoPagamento({ pagoEm }, "reverter_pendente"),
      ).toEqual({ novoEstado: "Pendente", novoPagoEm: null });
    });
    it("reverter_sem_cobranca → Sem_cobranca, pagoEm null", () => {
      expect(
        resolverHistoricoPagamento({ pagoEm }, "reverter_sem_cobranca"),
      ).toEqual({ novoEstado: "Sem_cobranca", novoPagoEm: null });
    });
  });
});
