"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import {
  buscarClientes,
  type ClienteSugestao,
} from "@/lib/actions/buscar-clientes.action";
import { formatarTelefoneSimples } from "@/lib/format/telefone";
import { normalizarTexto } from "@/lib/format/texto";
import { cn } from "@/lib/utils";

const MIN_CHARS_NOME = 2;
const DEBOUNCE_MS = 150;

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onClienteSelecionado: (cliente: ClienteSugestao) => void;
  onClienteDesselecionado: () => void;
  autoFocus?: boolean;
  "aria-invalid"?: boolean;
};

export function AutocompleteClienteNome({
  id,
  value,
  onChange,
  onClienteSelecionado,
  onClienteDesselecionado,
  autoFocus,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [indexHover, setIndexHover] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);

  // Debounce do trigger de busca. A query efetiva é mantida no estado
  // do parent (RHF); debouncedQuery decide quando disparar a action.
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value]);

  useEffect(() => {
    const normalizada = normalizarTexto(debouncedQuery);
    if (normalizada.length < MIN_CHARS_NOME) return; // limpeza acontece no onChange (event), não aqui

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

  // Click outside fecha o dropdown
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

  // Destaca a parte casada no nome.
  function renderNome(nome: string, query: string) {
    const queryNormalizada = normalizarTexto(query);
    const nomeNormalizado = normalizarTexto(nome);
    const idx = nomeNormalizado.indexOf(queryNormalizada);
    if (idx === -1 || queryNormalizada.length === 0) return nome;
    return (
      <>
        {nome.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800">
          {nome.slice(idx, idx + queryNormalizada.length)}
        </mark>
        {nome.slice(idx + queryNormalizada.length)}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        autoFocus={autoFocus}
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
          // Limpa dropdown imediatamente se query encurtou abaixo do mínimo
          // (evita ficar com sugestões velhas até o debounce expirar).
          if (normalizarTexto(v).length < MIN_CHARS_NOME) {
            setSugestoes([]);
            setAberto(false);
          }
        }}
        onFocus={() => {
          if (normalizarTexto(value).length >= MIN_CHARS_NOME && sugestoes.length > 0) {
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
                  // mousedown (não click) para vencer o onBlur que fecharia o dropdown
                  e.preventDefault();
                  selecionar(s);
                }}
              >
                <div className="font-medium">{renderNome(s.nome, value)}</div>
                <div className="text-muted-foreground text-xs">
                  {formatarTelefoneSimples(s.telefone) || s.telefone}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
