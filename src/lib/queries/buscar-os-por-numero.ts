import { db } from "@/lib/db/client";

// Busca uma OS pelo número sequencial visível (FR-5). Usa o cliente com
// soft-delete extension — OSs deletadas retornam null automaticamente.

export async function buscarOsPorNumero(numero: number) {
  return db.os.findUnique({
    where: { numeroSequencial: numero },
    include: { cliente: true },
  });
}

export type OsComCliente = NonNullable<Awaited<ReturnType<typeof buscarOsPorNumero>>>;
