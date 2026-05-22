import { describe, it, expect } from "vitest";

import { normalizarTelefone } from "./telefone";

describe("normalizarTelefone", () => {
  it("formato BR comum vira só dígitos", () => {
    expect(normalizarTelefone("(11) 99999-8888")).toBe("11999998888");
  });

  it("preserva DDI quando o usuário digita +", () => {
    expect(normalizarTelefone("+55 11 99999 8888")).toBe("5511999998888");
  });

  it("string vazia retorna vazia", () => {
    expect(normalizarTelefone("")).toBe("");
  });

  it("só letras retorna vazia", () => {
    expect(normalizarTelefone("abc")).toBe("");
  });
});
