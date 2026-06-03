"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// not-found.tsx local do segmento [id]. Renderizado quando page.tsx chama
// notFound() (Cliente inexistente, soft-deleted ou id inválido).
//
// Por que client component: Next 16 não passa `params` para not-found.tsx;
// usamos useParams() para obter o token e construir o link "Voltar ao
// dashboard". Sem isso, o usuário ficaria preso na página de erro.

export default function ClienteNaoEncontrado() {
  const params = useParams<{ token: string }>();
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Cliente não encontrado
      </h1>
      <p className="text-muted-foreground mb-8">
        O cliente que você procurou não existe ou foi removido.
      </p>
      <Link
        href={`/${params.token}/`}
        className="text-primary underline-offset-4 hover:underline"
      >
        ← Voltar ao dashboard
      </Link>
    </section>
  );
}
