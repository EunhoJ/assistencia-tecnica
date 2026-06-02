import Link from "next/link";

import { Button } from "@/components/ui/button";

// Botão "Reabrir" do detalhe (FR-19 / Story 2.7). Navegação pura para o fluxo
// dedicado — Server Component (sem interatividade). Aparece só em OS terminal
// (a página decide), cor secundária.

export function BotaoReabrir({
  token,
  numero,
}: {
  token: string;
  numero: number;
}) {
  return (
    <Button asChild variant="secondary" className="min-h-[44px] self-start">
      <Link href={`/${token}/os/${numero}/reabrir`}>Reabrir</Link>
    </Button>
  );
}
