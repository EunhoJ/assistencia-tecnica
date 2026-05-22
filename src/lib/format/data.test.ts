import { describe, it, expect } from "vitest";

import { formatDataHora } from "./data";

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
