// Domínio do relatório "Aparelhos parados" (FR-14 / Story 3.3). Puro.
//
// A CONTAGEM de dias é o primitivo de calendário em SP da Story 3.2
// (`calcularDiasCorridos`); aqui só damos o nome semântico do domínio e a
// POLÍTICA do limiar.

import { calcularDiasCorridos } from "@/lib/format/data";

// Dias que a OS está parada no Status atual (dias de calendário completos em
// São Paulo). Delega ao primitivo de data — não reimplementa a contagem.
export function calcularDiasParados(statusAlteradoEm: Date, agora: Date): number {
  return calcularDiasCorridos(statusAlteradoEm, agora);
}

// FR-14: a OS conta como "parada" a partir do limiar (rótulo da config:
// "considerar parado APÓS N dias"). Decisão `>=` (não `>`): em N dias exatos
// já conta — consistente com o teste-limite 29/30.
export function excedeLimiar(dias: number, limiar: number): boolean {
  return dias >= limiar;
}
