import { describe, it, expect } from "vitest";

import { calcularDiasParados, excedeLimiar } from "./parados";

describe("parados domain", () => {
  describe("excedeLimiar", () => {
    it("29 dias com limiar 30 → false", () => {
      expect(excedeLimiar(29, 30)).toBe(false);
    });
    it("30 dias com limiar 30 → true (conta a partir do limiar)", () => {
      expect(excedeLimiar(30, 30)).toBe(true);
    });
    it("31 dias com limiar 30 → true", () => {
      expect(excedeLimiar(31, 30)).toBe(true);
    });
    it("0 dias com limiar 30 → false", () => {
      expect(excedeLimiar(0, 30)).toBe(false);
    });
    it("30 dias com limiar 45 → false", () => {
      expect(excedeLimiar(30, 45)).toBe(false);
    });
  });

  describe("calcularDiasParados (delega a calcularDiasCorridos)", () => {
    it("mesmo dia em SP → 0", () => {
      const a = new Date("2026-05-10T12:00:00Z"); // 09h SP
      const b = new Date("2026-05-10T20:00:00Z"); // 17h SP, mesmo dia
      expect(calcularDiasParados(a, b)).toBe(0);
    });
    it("+30 dias de calendário → 30", () => {
      const a = new Date("2026-05-01T15:00:00Z"); // 12h SP, 01/05
      const b = new Date("2026-05-31T15:00:00Z"); // 12h SP, 31/05
      expect(calcularDiasParados(a, b)).toBe(30);
    });
  });
});
