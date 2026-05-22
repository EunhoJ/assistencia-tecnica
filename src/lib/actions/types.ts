// Forma canônica de retorno para toda Server Action (architecture.md
// §Padrões de formato). Discriminated union: o consumidor faz `if
// (result.ok)` antes de acessar `result.data` e o TS força exaustividade
// no `code` ao tratar `result.error`.

export type ActionErrorCode = "VALIDACAO" | "NAO_ENCONTRADO" | "CONFLITO" | "INTERNO";

export type ActionError =
  | { code: "VALIDACAO"; campos: Record<string, string> }
  | { code: "NAO_ENCONTRADO"; entidade: string }
  | { code: "CONFLITO"; mensagem: string }
  | { code: "INTERNO"; mensagem: string };

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
