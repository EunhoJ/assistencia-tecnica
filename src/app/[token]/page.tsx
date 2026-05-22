import Link from "next/link";

import { Button } from "@/components/ui/button";

// Dashboard provisório. Story 1.7 substitui pela listagem real de OSs.
export default async function Dashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Assistência Técnica
      </h1>
      <p className="text-muted-foreground text-lg">
        Gestão de Ordens de Serviço da oficina.
      </p>
      <Button asChild size="lg" className="min-h-[56px] px-10 text-lg">
        <Link href={`/${token}/os/nova`}>+ Nova OS</Link>
      </Button>
    </section>
  );
}
