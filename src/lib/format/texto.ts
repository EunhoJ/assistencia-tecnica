// Normaliza texto para comparação tolerante a acentos e case.
// Equivalente JS-side de `lower(public.f_unaccent(...))` no Postgres
// (Story 1.3 hotfix P3018). Usado pelo autocomplete de Cliente:
// - server: prepara o param do $queryRaw para casar o índice GIN
// - client: encontra a substring casada para destacar (<mark>) na sugestão

export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
