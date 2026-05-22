import { describe, it, expect } from "vitest";

import {
  STATUS_ATIVOS,
  STATUS_TERMINAIS,
  ehAtivo,
  ehTerminal,
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
});
