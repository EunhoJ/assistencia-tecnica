// Logger estruturado. Saída JSON via console.* — capturada pelos logs
// nativos da Vercel.

type LogLevel = "info" | "error";

type LogContext = Record<string, unknown>;

function emit(level: LogLevel, event: string, contexto: LogContext): void {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...contexto,
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const log = {
  event(event: string, contexto: LogContext = {}): void {
    emit("info", event, contexto);
  },
  error(event: string, erro: unknown, contexto: LogContext = {}): void {
    const errorPayload =
      erro instanceof Error
        ? { name: erro.name, message: erro.message }
        : { message: String(erro) };
    emit("error", event, { ...contexto, error: errorPayload });
  },
};

export function redactPath(pathname: string, token: string | null): string {
  if (!token) return pathname;
  const segments = pathname.split("/");
  if (segments.length < 2) return pathname;
  // segments[0] é string vazia (path começa com '/'); segments[1] é o primeiro segment
  if (segments[1] === token) {
    segments[1] = "{redacted}";
  }
  return segments.join("/");
}

// Defesa contra vazar telefone em logs (FR-2, FR-11). Recebe telefone em
// qualquer formato, normaliza para só dígitos, retorna "***" + últimos 4
// se ≥4 dígitos, senão "***".
export function redactTelefone(t: string): string {
  const digits = t.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return "***" + digits.slice(-4);
}

// Granularidade defensiva para logs analíticos sem expor valor exato
// (FR-10, FR-15). Entrada em centavos (Int).
export function redactValor(centavos: number): string {
  if (centavos === 0) return "R$ 0";
  if (centavos < 10000) return "R$ 0-100";
  if (centavos < 50000) return "R$ 100-500";
  if (centavos < 100000) return "R$ 500-1000";
  return "R$ >1000";
}
