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
  it("injeta deletado_em: null em findMany de os quando args.where existe", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args = { where: { status: "Recebido" } };
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletado_em: null, status: "Recebido" }),
      }),
    );
  });

  it("injeta deletado_em: null em findMany de os quando args.where está ausente", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args: { where?: Record<string, unknown> } = {};
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletado_em: null }) }),
    );
  });

  it("permite o caller sobrescrever deletado_em (caminho Lixeira)", async () => {
    const handler = getHandler("os", "findMany");
    const query = vi.fn(async (a) => a);
    const args = { where: { deletado_em: { not: null } } };
    await handler({ args, query });
    // O spread `{ deletado_em: null, ...args.where }` faz com que o valor do
    // caller (deletado_em: { not: null }) prevaleça.
    const callArgs = query.mock.calls[0][0] as { where: { deletado_em: unknown } };
    expect(callArgs.where.deletado_em).toEqual({ not: null });
  });

  it("injeta deletado_em: null em count de cliente", async () => {
    const handler = getHandler("cliente", "count");
    const query = vi.fn(async (a) => a);
    const args = {};
    await handler({ args, query });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletado_em: null }) }),
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
