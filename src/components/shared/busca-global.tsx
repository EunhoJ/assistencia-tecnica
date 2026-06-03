"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { OsCard } from "@/components/os/os-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buscarOs } from "@/lib/actions/buscar-os.action";
import type { OsResumo } from "@/lib/queries/listar-os-dashboard";

// Busca global de OS (FR-16/17, Story 4.1). Client Component no topo do
// dashboard. A lista recente (server-rendered) entra como `children` e é
// exibida enquanto não há busca ativa — só os resultados (genuinamente client)
// trafegam como dados. Debounce 200ms + useTransition; URL `?q=` para o botão
// "Voltar" do navegador restaurar a busca.

const DEBOUNCE_MS = 200;

// Resultado amarrado à query que o gerou — evita exibir dados de uma busca
// anterior enquanto a atual ainda não voltou (e dispensa setState no efeito).
type Resultado = { q: string; data: OsResumo[] };

export function BuscaGlobal({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hidrata a query inicial da URL (deep-link / volta do navegador). Lido uma
  // vez na montagem — daí em diante o input local é a fonte da verdade.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(query);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  // Autofocus só em desktop (≥640px) — evita abrir o teclado no celular do pai.
  useEffect(() => {
    if (window.matchMedia("(min-width: 640px)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  // Debounce do input.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // Sincroniza a URL e dispara a busca quando a query debounced muda.
  useEffect(() => {
    const q = debounced.trim();

    router.replace(q ? `/${token}?q=${encodeURIComponent(q)}` : `/${token}`, {
      scroll: false,
    });

    if (q.length === 0) return;

    seqRef.current += 1;
    const minhaSeq = seqRef.current;
    startTransition(async () => {
      const result = await buscarOs({ query: q });
      if (minhaSeq !== seqRef.current) return; // ignora resposta obsoleta
      setResultado({ q, data: result.ok ? result.data : [] });
    });
  }, [debounced, router, token]);

  const q = query.trim();
  const buscando = q.length > 0;
  // Resultado só vale se corresponde à query atual (senão, ainda carregando).
  const atual = resultado && resultado.q === q ? resultado.data : null;

  function limpar() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          aria-label="Buscar OS por nome ou telefone"
          autoComplete="off"
          className="min-h-[44px]"
        />
        {isPending && (
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            Buscando…
          </span>
        )}
      </div>

      {!buscando ? (
        children
      ) : atual === null ? (
        <p className="text-muted-foreground text-sm">Buscando…</p>
      ) : atual.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma OS encontrada para “{q}”.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tente buscar por nome ou pelo telefone com pelo menos 4 dígitos.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {atual.length} {atual.length === 1 ? "resultado" : "resultados"}{" "}
              para “{q}”
            </p>
            <Button variant="ghost" onClick={limpar} className="min-h-[44px]">
              Limpar busca
            </Button>
          </div>
          <ul className="flex flex-col gap-3">
            {atual.map((os) => (
              <li key={os.id}>
                <OsCard os={os} token={token} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
