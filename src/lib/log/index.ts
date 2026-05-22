// Logger estruturado minimalista. Saída JSON via console.* — capturada
// pelos logs nativos da Vercel. Story 1.4 estende com redactor de PII
// (telefone, valor).

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
