// Utilitários de moeda. Armazenamento é sempre INTEGER em centavos (Regra
// Inegociável 6); nunca float. Formatação para UI é 100% manual (sem
// toLocaleString/Intl) para output determinístico e sem variação ICU.

export function centavosParaReais(c: number): number {
  return c / 100;
}

/**
 * Converte string ou number em centavos (integer).
 * Aceita:
 *   - number: `280.5` → 28050
 *   - string com vírgula (padrão pt-BR): `"280,50"` → 28050
 *   - string com ponto decimal (US fallback): `"280.50"` → 28050
 *   - string com prefixo R$: `"R$ 280,50"` → 28050
 *   - string com separador de milhar pt-BR: `"1.234,56"` → 123456
 *
 * **Premissa pt-BR:** quando string contém VÍRGULA, o `.` é tratado como
 * separador de milhar e removido. Quando NÃO contém vírgula, o `.` (se
 * houver) é tratado como decimal. Bug potencial: `"1.5"` (US, 1.5 reais)
 * é interpretado como "1,5 reais"; em pt-BR isso seria escrito `"1,5"`.
 * v1 aceita a premissa (form RHF está em pt-BR).
 *
 * Lança `Error` se o input não é parseável como número finito.
 */
export function reaisParaCentavos(r: number | string): number {
  let num: number;
  if (typeof r === "number") {
    num = r;
  } else {
    const limpo = r.replace(/R\$\s?/, "").trim();
    const temVirgula = limpo.includes(",");
    const normalizado = temVirgula
      ? limpo.replace(/\./g, "").replace(",", ".")
      : limpo;
    num = Number.parseFloat(normalizado);
  }
  if (!Number.isFinite(num)) {
    throw new Error(`valor de reais inválido: ${String(r)}`);
  }
  return Math.round(num * 100);
}

/**
 * Formata centavos como string pt-BR: `28050` → `"R$ 280,50"`.
 * Separador de milhar: `.`; decimal: `,`. Negativos: `-R$ 280,50`.
 * Implementação manual (sem `toLocaleString`/`Intl`) — saída determinística
 * sem dependência de ICU.
 */
export function formatBRL(centavos: number): string {
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const reais = Math.trunc(abs / 100);
  const cents = abs % 100;
  const reaisStr = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const centsStr = String(cents).padStart(2, "0");
  return `${sign}R$ ${reaisStr},${centsStr}`;
}
