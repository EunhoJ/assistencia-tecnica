import { describe, it, expect } from "vitest";

import { normalizarTexto } from "./texto";

describe("normalizarTexto", () => {
  it("remove acento e abaixa case", () => {
    expect(normalizarTexto("João")).toBe("joao");
    expect(normalizarTexto("AÇÃO")).toBe("acao");
    expect(normalizarTexto("Maria José")).toBe("maria jose");
  });

  it("preserva caracteres ASCII inalterados (já em lowercase)", () => {
    expect(normalizarTexto("abc")).toBe("abc");
  });

  it("string vazia retorna vazia", () => {
    expect(normalizarTexto("")).toBe("");
  });

  it("preserva espaços e pontuação", () => {
    expect(normalizarTexto("D'Ávila Souza")).toBe("d'avila souza");
  });

  it("cobre diacríticos comuns em PT-BR", () => {
    expect(normalizarTexto("Ñoño Çedilha")).toBe("nono cedilha");
  });
});
