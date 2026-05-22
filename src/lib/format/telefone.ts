// Normaliza telefone para apenas dígitos. Aceita qualquer formato livre
// digitado pelo usuário (parênteses, hífen, espaço, DDI com +).
// Usado em FR-2 (cadastro inline) e FR-11 (autocomplete por telefone).

export function normalizarTelefone(t: string): string {
  return t.replace(/\D/g, "");
}
