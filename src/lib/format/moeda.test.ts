import { describe, it, expect } from "vitest";

import { centavosParaReais, reaisParaCentavos, formatBRL } from "./moeda";

describe("centavosParaReais", () => {
  it("12345 → 123.45", () => {
    expect(centavosParaReais(12345)).toBe(123.45);
  });
  it("0 → 0", () => {
    expect(centavosParaReais(0)).toBe(0);
  });
});

describe("reaisParaCentavos", () => {
  it("aceita number 280.5 → 28050", () => {
    expect(reaisParaCentavos(280.5)).toBe(28050);
  });
  it('aceita string pt-BR "280,50" → 28050', () => {
    expect(reaisParaCentavos("280,50")).toBe(28050);
  });
  it('aceita string US "280.50" → 28050', () => {
    expect(reaisParaCentavos("280.50")).toBe(28050);
  });
  it('aceita prefixo "R$ " → 28050', () => {
    expect(reaisParaCentavos("R$ 280,50")).toBe(28050);
  });
  it('aceita milhar pt-BR "1.234,56" → 123456', () => {
    expect(reaisParaCentavos("1.234,56")).toBe(123456);
  });
  it("lança Error em input inválido", () => {
    expect(() => reaisParaCentavos("abc")).toThrowError(/valor de reais inválido/);
  });
});

describe("formatBRL", () => {
  it("28050 → 'R$ 280,50'", () => {
    expect(formatBRL(28050)).toBe("R$ 280,50");
  });
  it("0 → 'R$ 0,00'", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });
  it("100 → 'R$ 1,00'", () => {
    expect(formatBRL(100)).toBe("R$ 1,00");
  });
  it("milhar com ponto", () => {
    expect(formatBRL(1234567)).toBe("R$ 12.345,67");
  });
  it("negativos com prefixo '-'", () => {
    expect(formatBRL(-28050)).toBe("-R$ 280,50");
  });

  it("invariante float: 0.3 sobrevive ao round-trip sem precisão fantasma", () => {
    expect(reaisParaCentavos(0.3)).toBe(30);
    expect(formatBRL(30)).toBe("R$ 0,30");
  });
});
