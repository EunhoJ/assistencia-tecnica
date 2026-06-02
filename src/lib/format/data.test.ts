import { describe, it, expect } from "vitest";

import { calcularDiasCorridos, formatDataHora } from "./data";

describe("formatDataHora", () => {
  // 23h50 do dia 30/04 em São Paulo (BRT = UTC-3) equivale a 02h50 UTC do dia 01/05.
  const lateApril = new Date("2026-05-01T02:50:00Z");
  // 00h05 do dia 01/05 em São Paulo equivale a 03h05 UTC do dia 01/05.
  const earlyMay = new Date("2026-05-01T03:05:00Z");

  it("mês-borda: 30/04 23h50 BRT formata como 30/04", () => {
    expect(formatDataHora(lateApril, "dd/MM/yyyy")).toBe("30/04/2026");
  });

  it("mês-borda: 30/04 23h50 BRT formata como 30/04/2026 23:50 no default", () => {
    expect(formatDataHora(lateApril)).toBe("30/04/2026 23:50");
  });

  it("mês-borda: 01/05 00h05 BRT formata como 01/05 (cai em mês diferente da data anterior)", () => {
    expect(formatDataHora(earlyMay, "dd/MM/yyyy")).toBe("01/05/2026");
  });

  it("default format é 'dd/MM/yyyy HH:mm'", () => {
    expect(formatDataHora(earlyMay)).toBe("01/05/2026 00:05");
  });
});

describe("calcularDiasCorridos", () => {
  // 30/04 23h50 BRT e 01/05 00h10 BRT — instantes <24h mas em dias de
  // calendário diferentes em São Paulo.
  const abril30_2350 = new Date("2026-05-01T02:50:00Z");
  const maio01_0010 = new Date("2026-05-01T03:10:00Z");

  it("mesmo dia em SP → 0", () => {
    const a = new Date("2026-05-10T12:00:00Z"); // 09h SP
    const b = new Date("2026-05-10T20:00:00Z"); // 17h SP, mesmo dia
    expect(calcularDiasCorridos(a, b)).toBe(0);
  });

  it("virada de dia em SP (<24h) → 1", () => {
    expect(calcularDiasCorridos(abril30_2350, maio01_0010)).toBe(1);
  });

  it("+30 dias de calendário → 30", () => {
    const a = new Date("2026-05-01T15:00:00Z"); // 12h SP, 01/05
    const b = new Date("2026-05-31T15:00:00Z"); // 12h SP, 31/05
    expect(calcularDiasCorridos(a, b)).toBe(30);
  });

  it("limite 29 vs 30 (relevante para o limiar)", () => {
    const base = new Date("2026-05-01T15:00:00Z"); // 01/05 12h SP
    const dia29 = new Date("2026-05-30T15:00:00Z"); // 30/05 → 29 dias
    const dia30 = new Date("2026-05-31T15:00:00Z"); // 31/05 → 30 dias
    expect(calcularDiasCorridos(base, dia29)).toBe(29);
    expect(calcularDiasCorridos(base, dia30)).toBe(30);
  });
});
