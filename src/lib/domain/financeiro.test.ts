import { describe, it, expect } from "vitest";

import { agregarMes, calcularDelta } from "./financeiro";

describe("financeiro domain", () => {
  describe("agregarMes", () => {
    it("mês cheio (3 formas) → total, breakdown e percentuais (~100%)", () => {
      const ag = agregarMes([
        { formaPagamento: "PIX", valorCentavos: 520000 },
        { formaPagamento: "Dinheiro", valorCentavos: 210000 },
        { formaPagamento: "Cartao", valorCentavos: 112000 },
      ]);
      expect(ag.totalCentavos).toBe(842000);
      expect(ag.qtdOss).toBe(3);
      expect(ag.breakdown.PIX).toEqual({
        centavos: 520000,
        count: 1,
        percentual: 61.8,
      });
      expect(ag.breakdown.Dinheiro).toEqual({
        centavos: 210000,
        count: 1,
        percentual: 24.9,
      });
      expect(ag.breakdown.Cartao).toEqual({
        centavos: 112000,
        count: 1,
        percentual: 13.3,
      });
      const soma =
        ag.breakdown.PIX.percentual +
        ag.breakdown.Dinheiro.percentual +
        ag.breakdown.Cartao.percentual;
      expect(soma).toBeCloseTo(100, 1);
    });

    it("agrega múltiplas OSs da mesma forma (count e soma)", () => {
      const ag = agregarMes([
        { formaPagamento: "PIX", valorCentavos: 10000 },
        { formaPagamento: "PIX", valorCentavos: 30000 },
      ]);
      expect(ag.breakdown.PIX).toEqual({
        centavos: 40000,
        count: 2,
        percentual: 100,
      });
      expect(ag.breakdown.Dinheiro.percentual).toBe(0);
    });

    it("mês vazio → total 0, qtdOss 0, percentuais 0 (não NaN)", () => {
      const ag = agregarMes([]);
      expect(ag.totalCentavos).toBe(0);
      expect(ag.qtdOss).toBe(0);
      expect(ag.breakdown.PIX.percentual).toBe(0);
      expect(ag.breakdown.Dinheiro.percentual).toBe(0);
      expect(ag.breakdown.Cartao.percentual).toBe(0);
      expect(Number.isNaN(ag.breakdown.PIX.percentual)).toBe(false);
    });

    it("valorCentavos null conta em qtdOss mas soma 0", () => {
      const ag = agregarMes([
        { formaPagamento: "PIX", valorCentavos: null },
        { formaPagamento: "Dinheiro", valorCentavos: 5000 },
      ]);
      expect(ag.totalCentavos).toBe(5000);
      expect(ag.qtdOss).toBe(2);
      expect(ag.breakdown.PIX.count).toBe(1);
      expect(ag.breakdown.PIX.centavos).toBe(0);
    });

    it("formaPagamento null (defensivo) entra no total mas não cria bucket", () => {
      const ag = agregarMes([{ formaPagamento: null, valorCentavos: 8000 }]);
      expect(ag.totalCentavos).toBe(8000);
      expect(ag.qtdOss).toBe(1);
      expect(ag.breakdown.PIX.count).toBe(0);
      expect(ag.breakdown.Dinheiro.count).toBe(0);
      expect(ag.breakdown.Cartao.count).toBe(0);
    });
  });

  describe("calcularDelta", () => {
    it("positivo → absoluto e percentual com 1 casa", () => {
      expect(calcularDelta(842000, 711000)).toEqual({
        absoluto: 131000,
        percentual: 18.4,
      });
    });

    it("negativo → absoluto negativo e percentual negativo", () => {
      expect(calcularDelta(500000, 1000000)).toEqual({
        absoluto: -500000,
        percentual: -50,
      });
    });

    it("anterior 0 → percentual null (sem comparativo, não Infinity)", () => {
      expect(calcularDelta(300000, 0)).toEqual({
        absoluto: 300000,
        percentual: null,
      });
    });

    it("ambos 0 → absoluto 0, percentual null", () => {
      expect(calcularDelta(0, 0)).toEqual({ absoluto: 0, percentual: null });
    });
  });
});
