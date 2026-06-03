import { ResumoFinanceiroMes } from "@/components/relatorios/resumo-financeiro-mes";
import { mesCorrenteSP } from "@/lib/format/data";
import { resumoFinanceiroMensal } from "@/lib/queries/resumo-financeiro-mensal";

// Rota do Resumo financeiro mensal (FR-15 / Story 3.4). Server Component
// dinâmico — lê `?mes=YYYY-MM` (Next 16: searchParams é Promise) + `new Date()`,
// então recomputa a cada load (freshness após reabertura/soft-delete).

const MES_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export default async function ResumoFinanceiroPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { token } = await params;
  const { mes: mesQuery } = await searchParams;

  const corrente = mesCorrenteSP(new Date());

  // Default = mês corrente. Parseia `?mes`; ignora inválido e clampa futuro
  // ao corrente (mantém a invariante do botão ">").
  let ano = corrente.ano;
  let mes = corrente.mes;
  const match = mesQuery?.match(MES_RE);
  if (match) {
    const a = Number(match[1]);
    const m = Number(match[2]);
    const futuro = a > corrente.ano || (a === corrente.ano && m > corrente.mes);
    if (!futuro) {
      ano = a;
      mes = m;
    }
  }

  const podeAvancar = !(ano === corrente.ano && mes === corrente.mes);
  const resumo = await resumoFinanceiroMensal({ ano, mes });

  return (
    <ResumoFinanceiroMes token={token} resumo={resumo} podeAvancar={podeAvancar} />
  );
}
