import { BadgeStatus } from "@/components/os/badge-status";
import { BotaoRestaurar } from "@/components/configuracoes/botao-restaurar";
import type { StatusOs } from "@/lib/domain/status";
import { formatDataHora } from "@/lib/format/data";
import type { LixeiraRow } from "@/lib/queries/listar-lixeira";

// Lista de OSs na Lixeira (Story 2.6). Cada linha mostra o número, Cliente,
// o Status que a OS tinha, datas de criação e exclusão, e o botão Restaurar.
// Empilha em cards no mobile (<640px).

export function TabelaLixeira({ linhas }: { linhas: LixeiraRow[] }) {
  if (linhas.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center">
        Lixeira vazia.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {linhas.map((os) => (
        <li
          key={os.numeroSequencial}
          className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                #{os.numeroSequencial}
              </span>
              <BadgeStatus status={os.status as StatusOs} />
            </div>
            <span>{os.cliente.nome}</span>
            <span className="text-muted-foreground text-xs">
              Criada em {formatDataHora(os.criadoEm)} · Excluída em{" "}
              {os.deletadoEm ? formatDataHora(os.deletadoEm) : "—"}
            </span>
          </div>
          <BotaoRestaurar numero={os.numeroSequencial} />
        </li>
      ))}
    </ul>
  );
}
