"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// not-found.tsx local do segmento [numero]. Renderizado quando page.tsx
// chama notFound() (OS inexistente ou soft-deleted).
//
// Por que client component: Next 16 não passa `params` para not-found.tsx;
// usamos useParams() para obter o token e construir o link "Voltar ao
// dashboard". Sem isso, o usuário ficaria preso na página de erro.

export default function OsNaoEncontrada() {
  const params = useParams<{ token: string }>();
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">OS não encontrada</h1>
      <p className="text-muted-foreground mb-8">
        A OS que você procurou não existe ou foi removida.
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
