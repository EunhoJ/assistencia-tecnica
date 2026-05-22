import Link from "next/link";
import { notFound } from "next/navigation";

import { buscarOsPorNumero } from "@/lib/queries/buscar-os-por-numero";

// Versão MÍNIMA do detalhe da OS — esta story só precisa mostrar o número
// grande para confirmar o cadastro (FR-5). Story 1.7 substitui com a versão
// rica (badges de status/pagamento, datas, todos os campos).

export default async function OsDetalhePage({
  params,
}: {
  params: Promise<{ token: string; numero: string }>;
}) {
  const { token, numero: numeroStr } = await params;
  const numero = Number(numeroStr);

  if (!Number.isInteger(numero) || numero <= 0) {
    notFound();
  }

  const os = await buscarOsPorNumero(numero);
  if (!os) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-6xl font-bold tracking-tight">
        OS #{os.numeroSequencial}
      </h1>

      <dl className="flex flex-col gap-4 text-base">
        <div>
          <dt className="text-muted-foreground text-sm font-medium">Cliente</dt>
          <dd className="text-lg">{os.cliente.nome}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm font-medium">Telefone</dt>
          <dd>{os.cliente.telefone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm font-medium">Aparelho</dt>
          <dd>
            {os.aparelhoTipo}
            {os.aparelhoDescricao ? ` — ${os.aparelhoDescricao}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm font-medium">Defeito</dt>
          <dd className="whitespace-pre-wrap">{os.defeitoRelatado}</dd>
        </div>
      </dl>

      <Link
        href={`/${token}/`}
        className="text-primary mt-8 inline-block underline-offset-4 hover:underline"
      >
        ← Voltar ao início
      </Link>
    </section>
  );
}
