import Link from "next/link";

import { Button } from "@/components/ui/button";

// NavBar mínima do app. Renderiza link "Nova OS" como ação primária.
// Mantém token na URL para preservar autenticação ao navegar.
// Touch target ≥44×44 px via min-h-[44px] (NFR-2).
export function NavBar({ token }: { token: string }) {
  return (
    <nav className="flex items-center justify-between border-b px-4 py-3">
      <Link
        href={`/${token}/`}
        className="text-lg font-semibold tracking-tight"
      >
        Assistência Técnica
      </Link>
      <Button asChild size="lg" className="min-h-[44px] px-6">
        <Link href={`/${token}/os/nova`}>Nova OS</Link>
      </Button>
    </nav>
  );
}
