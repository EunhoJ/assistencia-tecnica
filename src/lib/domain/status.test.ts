import { describe, it, expect } from "vitest";

import {
  STATUS_ATIVOS,
  STATUS_TERMINAIS,
  ehAtivo,
  ehTerminal,
  ehTransicaoNaoNatural,
  podeTransicionar,
  transicoesValidas,
  type StatusOs,
} from "./status";

const ATIVOS: StatusOs[] = ["Recebido", "Orcamento", "Aguardando_peca", "Consertado"];
const TERMINAIS: StatusOs[] = ["Entregue", "Cancelado", "Sem_solucao"];

describe("status domain", () => {
  describe("ehAtivo", () => {
    for (const s of ATIVOS) {
      it(`retorna true para ${s}`, () => {
        expect(ehAtivo(s)).toBe(true);
      });
    }
    for (const s of TERMINAIS) {
      it(`retorna false para ${s}`, () => {
        expect(ehAtivo(s)).toBe(false);
      });
    }
  });

  describe("ehTerminal", () => {
    for (const s of TERMINAIS) {
      it(`retorna true para ${s}`, () => {
        expect(ehTerminal(s)).toBe(true);
      });
    }
    for (const s of ATIVOS) {
      it(`retorna false para ${s}`, () => {
        expect(ehTerminal(s)).toBe(false);
      });
    }
  });

  it("STATUS_ATIVOS + STATUS_TERMINAIS cobrem os 7 valores do enum Prisma", () => {
    expect(STATUS_ATIVOS.length + STATUS_TERMINAIS.length).toBe(7);
  });

  it("nenhum status aparece em ambos os conjuntos (exclusividade mútua)", () => {
    for (const a of STATUS_ATIVOS) {
      expect(STATUS_TERMINAIS as readonly StatusOs[]).not.toContain(a);
    }
    for (const t of STATUS_TERMINAIS) {
      expect(STATUS_ATIVOS as readonly StatusOs[]).not.toContain(t);
    }
  });

  describe("podeTransicionar — happy path naturais", () => {
    it("Recebido → Orcamento é válido (natural)", () => {
      expect(podeTransicionar("Recebido", "Orcamento")).toBe(true);
    });
    it("Orcamento → Aguardando_peca é válido (natural)", () => {
      expect(podeTransicionar("Orcamento", "Aguardando_peca")).toBe(true);
    });
    it("Aguardando_peca → Consertado é válido (natural)", () => {
      expect(podeTransicionar("Aguardando_peca", "Consertado")).toBe(true);
    });
    it("Consertado → Entregue é válido (natural)", () => {
      expect(podeTransicionar("Consertado", "Entregue")).toBe(true);
    });
  });

  describe("podeTransicionar — não-naturais explícitas", () => {
    it("Recebido → Aguardando_peca é válido (pulando Orçamento)", () => {
      expect(podeTransicionar("Recebido", "Aguardando_peca")).toBe(true);
    });
    it("Recebido → Consertado é válido (pulando Orçamento e Aguardando peça)", () => {
      expect(podeTransicionar("Recebido", "Consertado")).toBe(true);
    });
    it("Orcamento → Consertado é válido (peça já em estoque)", () => {
      expect(podeTransicionar("Orcamento", "Consertado")).toBe(true);
    });
    it("Aguardando_peca → Entregue é válido (não marca Consertado intermediário)", () => {
      expect(podeTransicionar("Aguardando_peca", "Entregue")).toBe(true);
    });
  });

  describe("podeTransicionar — proibidas (voltar atrás)", () => {
    it("Orcamento → Recebido é inválido", () => {
      expect(podeTransicionar("Orcamento", "Recebido")).toBe(false);
    });
    it("Aguardando_peca → Recebido é inválido", () => {
      expect(podeTransicionar("Aguardando_peca", "Recebido")).toBe(false);
    });
    it("Aguardando_peca → Orcamento é inválido", () => {
      expect(podeTransicionar("Aguardando_peca", "Orcamento")).toBe(false);
    });
    it("Consertado → Recebido é inválido", () => {
      expect(podeTransicionar("Consertado", "Recebido")).toBe(false);
    });
    it("Entregue → Consertado é inválido", () => {
      expect(podeTransicionar("Entregue", "Consertado")).toBe(false);
    });
  });

  describe("podeTransicionar — proibidas (terminais alternativos via avanço)", () => {
    it("Recebido → Cancelado é inválido (acessado apenas via action dedicada)", () => {
      expect(podeTransicionar("Recebido", "Cancelado")).toBe(false);
    });
    it("Recebido → Sem_solucao é inválido (acessado apenas via action dedicada)", () => {
      expect(podeTransicionar("Recebido", "Sem_solucao")).toBe(false);
    });
    it("Consertado → Cancelado é inválido (acessado apenas via action dedicada)", () => {
      expect(podeTransicionar("Consertado", "Cancelado")).toBe(false);
    });
  });

  describe("transicoesValidas — terminais não avançam", () => {
    it("Entregue retorna lista vazia", () => {
      expect(transicoesValidas("Entregue")).toEqual([]);
    });
    it("Cancelado retorna lista vazia", () => {
      expect(transicoesValidas("Cancelado")).toEqual([]);
    });
    it("Sem_solucao retorna lista vazia", () => {
      expect(transicoesValidas("Sem_solucao")).toEqual([]);
    });
  });

  it("transicoesValidas — ordem (naturais primeiro)", () => {
    expect(transicoesValidas("Recebido")).toEqual([
      "Orcamento",
      "Aguardando_peca",
      "Consertado",
    ]);
  });

  describe("ehTransicaoNaoNatural", () => {
    it("Recebido → Orcamento é natural (false)", () => {
      expect(ehTransicaoNaoNatural("Recebido", "Orcamento")).toBe(false);
    });
    it("Recebido → Aguardando_peca é não-natural (true)", () => {
      expect(ehTransicaoNaoNatural("Recebido", "Aguardando_peca")).toBe(true);
    });
    it("Orcamento → Recebido não é transição válida nenhuma (false)", () => {
      expect(ehTransicaoNaoNatural("Orcamento", "Recebido")).toBe(false);
    });
    it("Orcamento → Consertado é não-natural (true)", () => {
      expect(ehTransicaoNaoNatural("Orcamento", "Consertado")).toBe(true);
    });
  });
});
