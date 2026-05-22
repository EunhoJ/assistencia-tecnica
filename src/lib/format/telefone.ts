// Normaliza telefone para apenas dígitos. Aceita qualquer formato livre
// digitado pelo usuário (parênteses, hífen, espaço, DDI com +).
// Usado em FR-2 (cadastro inline) e FR-11 (autocomplete por telefone).

export function normalizarTelefone(t: string): string {
  return t.replace(/\D/g, "");
}

// Formata telefone (já com dígitos normalizados) em padrão pt-BR para
// exibição em listas (autocomplete, dashboard, detalhe). Aceita 10 ou 11
// dígitos no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX. Para outros
// tamanhos, retorna o input cru.
export function formatarTelefoneSimples(digits: string): string {
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}
