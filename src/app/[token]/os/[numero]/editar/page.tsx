import { notFound } from "next/navigation";

import { FormularioEditarOs } from "@/components/os/formulario-editar-os";
import { buscarOsPorNumero } from "@/lib/queries/buscar-os-por-numero";

// Tela de edição de campos descritivos (FR-3 / Story 2.5). Server Component:
// busca a OS (soft-delete oculta), 404 se não existir, e popula o formulário
// com os valores atuais. Status e pagamento NÃO são editados aqui.

export default async function EditarOsPage({
  params,
}: {
  params: Promise<{ token: string; numero: string }>;
}) {
  const { numero: numeroStr } = await params;
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
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Editar OS #{os.numeroSequencial}
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Status e pagamento são alterados na tela de detalhe.
      </p>
      <FormularioEditarOs
        numero={os.numeroSequencial}
        valoresIniciais={{
          cliente: {
            nome: os.cliente.nome,
            telefone: os.cliente.telefone,
          },
          aparelho: {
            tipo: os.aparelhoTipo,
            descricao: os.aparelhoDescricao ?? "",
          },
          defeitoRelatado: os.defeitoRelatado,
          observacoes: os.observacoes ?? "",
        }}
      />
    </section>
  );
}
