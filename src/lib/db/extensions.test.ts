import { describe, it, expect, vi } from "vitest";

import { softDeleteExtension } from "./extensions";

// Helper: recupera o handler de uma operação para um modelo dentro da
// extension. A tipagem `defineExtension` de Prisma 7 mantém handlers tipados
// internamente; aqui acessamos como any para fazer chamada direta no teste.
function getHandler(modelo: "os" | "cliente", op: string) {
  const ext = softDeleteExtension();
  const query = (ext as unknown as { query: Record<string, Record<string, unknown>> }).query;
  return query[modelo][op] as (params: { args: { where?: Record<string, unknown> }; query: (a: unknown) => unknown }) => unknown;
}

describe("softDeleteExtension", () => {
  it("injeta deletadoEm: null em findMany de os quando args.where existe", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args = { where: { status: "Recebido" } };
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletadoEm: null, status: "Recebido" }),
      }),
    );
  });

  it("injeta deletadoEm: null em findMany de os quando args.where está ausente", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args: { where?: Record<string, unknown> } = {};
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletadoEm: null }) }),
    );
  });

  it("permite o caller sobrescrever deletadoEm (caminho Lixeira)", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args = { where: { deletadoEm: { not: null } } };
    await handler({ args, query });
    // O spread `{ deletadoEm: null, ...args.where }` faz com que o valor do
    // caller (deletadoEm: { not: null }) prevaleça.
    const callArgs = query.mock.calls[0][0] as { where: { deletadoEm: unknown } };
    expect(callArgs.where.deletadoEm).toEqual({ not: null });
  });

  it("injeta deletadoEm: null em count de cliente", async () => {
    const handler = getHandler("cliente", "count");
    const query = vi.fn(async (a) => a);
    const args = {};
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletadoEm: null }) }),
    );
  });

  it("expõe handlers para os 5 métodos de read em ambos modelos", () => {
    const ext = softDeleteExtension();
    const query = (ext as unknown as { query: Record<string, Record<string, unknown>> }).query;
    const expectedOps = ["findMany", "findUnique", "findFirst", "count", "aggregate"];
    for (const modelo of ["os", "cliente"] as const) {
      for (const op of expectedOps) {
        expect(typeof query[modelo][op]).toBe("function");
      }
    }
  });
});
