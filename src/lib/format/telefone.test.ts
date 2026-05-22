import { describe, it, expect } from "vitest";

import { normalizarTelefone, formatarTelefoneSimples } from "./telefone";

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

describe("formatarTelefoneSimples", () => {
  it("11 dígitos → (XX) XXXXX-XXXX", () => {
    expect(formatarTelefoneSimples("11999998888")).toBe("(11) 99999-8888");
  });

  it("10 dígitos → (XX) XXXX-XXXX", () => {
    expect(formatarTelefoneSimples("1133334444")).toBe("(11) 3333-4444");
  });

  it("tamanho fora dos dois formatos retorna input cru", () => {
    expect(formatarTelefoneSimples("123")).toBe("123");
    expect(formatarTelefoneSimples("")).toBe("");
  });
});
