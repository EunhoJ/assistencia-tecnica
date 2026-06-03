// Helpers compartilhados pelas Server Actions. As funções de idempotência
// recebem o cliente Prisma por DI (mesmo padrão dos wrappers da Lixeira)
// — caller passa `db` (singleton) ou `tx` (TransactionClient) para que
// possam participar de uma transação que cria a entidade junto com o
// ActionLog.

import type { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";

// Aceita o singleton `db` (com extension soft-delete) OU o `tx` recebido
// dentro de `db.$transaction(async (tx) => ...)`. Tipar precisamente os
// dois — extension-wrapped vs bare TransactionClient — é não-trivial em
// Prisma 7. Como esses helpers só rodam em código server trusted (Server
// Actions chamando do app), aceitamos `any` aqui em troca de não introduzir
// cast no callsite.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbCliente = any;

/**
 * Converte um ZodError em `{ [campo]: primeiraMensagem }` para alimentar
 * `{ code: "VALIDACAO", campos: ... }`. Para schemas com campos nested,
 * `flatten()` agrega no top-level por chave; nested profundos exigiriam
 * `format()` (não usado em v1 — schemas serão flat).
 */
export function fieldsFromZod(error: ZodError): Record<string, string> {
  // Em Zod 4 com ZodError genérico, `fieldErrors` é tipado como `{}`
  // (a forma exata depende do schema). Cast explícito para a forma
  // documentada (`Record<string, string[] | undefined>`) é seguro
  // porque o runtime sempre devolve esse shape.
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [campo, msgs] of Object.entries(fieldErrors)) {
    if (msgs && msgs.length > 0) {
      out[campo] = msgs[0]!;
    }
  }
  return out;
}

/**
 * Procura uma resposta já gravada para o `requestId` E a `action`. Se
 * encontrar, devolve a resposta como `T` (caller decidiu o shape). Se não
 * (ou se o `requestId` pertencer a OUTRA action — colisão), `null`.
 * Filtrar por `action` evita devolver o payload de uma entidade diferente.
 * Use dentro do mesmo `db.$transaction` que cria a entidade alvo.
 */
export async function verificarIdempotencia<T>(
  db: DbCliente,
  requestId: string,
  action: string,
): Promise<T | null> {
  const found = await db.actionLog.findUnique({ where: { requestId } });
  if (!found || found.action !== action) return null;
  return found.payloadRespostaJson as T;
}

/**
 * Grava a resposta da Server Action em `ActionLog` para idempotência.
 * Chamar APÓS a mutação alvo, dentro do mesmo `db.$transaction`.
 */
export async function gravarIdempotencia(
  db: DbCliente,
  requestId: string,
  action: string,
  resposta: unknown,
): Promise<void> {
  await db.actionLog.create({
    data: {
      requestId,
      action,
      payloadRespostaJson: resposta as Prisma.InputJsonValue,
    },
  });
}
