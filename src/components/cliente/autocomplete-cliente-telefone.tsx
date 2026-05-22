"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import {
  buscarClientes,
  type ClienteSugestao,
} from "@/lib/actions/buscar-clientes.action";
import { formatarTelefoneSimples, normalizarTelefone } from "@/lib/format/telefone";
import { cn } from "@/lib/utils";

const MIN_DIGITS_TEL = 4;
const DEBOUNCE_MS = 150;

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onClienteSelecionado: (cliente: ClienteSugestao) => void;
  onClienteDesselecionado: () => void;
  "aria-invalid"?: boolean;
};

export function AutocompleteClienteTelefone({
  id,
  value,
  onChange,
  onClienteSelecionado,
  onClienteDesselecionado,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [indexHover, setIndexHover] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);

  const [debouncedQuery, setDebouncedQuery] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value]);

  useEffect(() => {
    const digits = normalizarTelefone(debouncedQuery);
    if (digits.length < MIN_DIGITS_TEL) return; // limpeza acontece no onChange (event)

    seqRef.current += 1;
    const minhaSeq = seqRef.current;
    buscarClientes({ query: debouncedQuery, limite: 8 }).then((result) => {
      if (minhaSeq !== seqRef.current) return;
      if (result.ok) {
        setSugestoes(result.data);
        setAberto(true);
        setIndexHover(-1);
      }
    });
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selecionar(cliente: ClienteSugestao) {
    onClienteSelecionado(cliente);
    setAberto(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexHover((i) => (i + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexHover((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    } else if (e.key === "Enter" && indexHover >= 0) {
      e.preventDefault();
      selecionar(sugestoes[indexHover]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setAberto(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        value={value}
        autoComplete="off"
        aria-invalid={ariaInvalid}
        aria-autocomplete="list"
        aria-expanded={aberto}
        aria-controls={id ? `${id}-listbox` : undefined}
        className="min-h-[44px]"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          onClienteDesselecionado();
          if (normalizarTelefone(v).length < MIN_DIGITS_TEL) {
            setSugestoes([]);
            setAberto(false);
          }
        }}
        onFocus={() => {
          if (normalizarTelefone(value).length >= MIN_DIGITS_TEL && sugestoes.length > 0) {
            setAberto(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />

      {aberto && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="bg-popover text-popover-foreground absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
        >
          {sugestoes.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              Nenhum cliente encontrado — será cadastrado como novo
            </li>
          ) : (
            sugestoes.map((s, i) => (
              <li
                key={s.id}
                role="option"
                aria-selected={i === indexHover}
                className={cn(
                  "min-h-[44px] cursor-pointer px-3 py-2 text-sm",
                  i === indexHover && "bg-muted",
                )}
                onMouseEnter={() => setIndexHover(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selecionar(s);
                }}
              >
                <div className="font-medium">
                  {formatarTelefoneSimples(s.telefone) || s.telefone}
                </div>
                <div className="text-muted-foreground text-xs">{s.nome}</div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
