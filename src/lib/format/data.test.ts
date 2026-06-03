import { describe, it, expect } from "vitest";

import {
  calcularDiasCorridos,
  formatDataHora,
  formatMesAno,
  inicioDoMesSP,
  mesCorrenteSP,
  proximoMes,
} from "./data";

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

describe("inicioDoMesSP", () => {
  it("01/05 00:00 BRT = 03:00 UTC", () => {
    expect(inicioDoMesSP(2026, 5).toISOString()).toBe("2026-05-01T03:00:00.000Z");
  });

  it("mês de um dígito recebe padStart (janeiro)", () => {
    expect(inicioDoMesSP(2026, 1).toISOString()).toBe("2026-01-01T03:00:00.000Z");
  });
});

describe("proximoMes (rollover)", () => {
  it("dezembro vira janeiro do ano seguinte", () => {
    expect(proximoMes(2026, 12)).toEqual({ ano: 2027, mes: 1 });
  });

  it("mês comum só incrementa", () => {
    expect(proximoMes(2026, 5)).toEqual({ ano: 2026, mes: 6 });
  });
});

describe("atribuição de mês por timestamp em SP (borda 30/04 ↔ 01/05)", () => {
  // Mesmos instantes do teste de formatDataHora acima.
  const lateApril = new Date("2026-05-01T02:50:00Z"); // 23h50 30/04 BRT
  const earlyMay = new Date("2026-05-01T03:05:00Z"); // 00h05 01/05 BRT
  const inicioAbril = inicioDoMesSP(2026, 4);
  const inicioMaio = inicioDoMesSP(2026, 5);
  const inicioJunho = inicioDoMesSP(2026, 6);

  it("23h50 de 30/04 BRT cai em abril, não em maio", () => {
    expect(lateApril >= inicioAbril && lateApril < inicioMaio).toBe(true);
  });

  it("00h05 de 01/05 BRT cai em maio, não em abril", () => {
    expect(earlyMay >= inicioAbril && earlyMay < inicioMaio).toBe(false);
    expect(earlyMay >= inicioMaio && earlyMay < inicioJunho).toBe(true);
  });
});

describe("mesCorrenteSP", () => {
  it("20h30 BRT de 02/06 ainda é junho", () => {
    // 23h30 UTC de 02/06 = 20h30 BRT de 02/06.
    expect(mesCorrenteSP(new Date("2026-06-02T23:30:00Z"))).toEqual({
      ano: 2026,
      mes: 6,
    });
  });

  it("02h00 UTC de 01/06 ainda é 31/05 em SP (maio)", () => {
    // 02h UTC = 23h BRT do dia anterior → mês 5.
    expect(mesCorrenteSP(new Date("2026-06-01T02:00:00Z"))).toEqual({
      ano: 2026,
      mes: 5,
    });
  });
});

describe("formatMesAno", () => {
  it("maio 2026", () => {
    expect(formatMesAno(2026, 5)).toBe("Maio 2026");
  });

  it("dezembro 2026", () => {
    expect(formatMesAno(2026, 12)).toBe("Dezembro 2026");
  });
});
