"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type FloorTable = {
  id: string;
  label: string;
  capacity: number;
  status: string;
  orderAmount?: number;
  openedMinutes?: number;
};

export type FloorArea = {
  id: string;
  name: string;
  isVip: boolean;
  tables: FloorTable[];
};

const statusMeta: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  libre: {
    label: "Libre",
    className: "border-[#d9cdb0] bg-[#151517] text-foreground",
    dotClassName: "bg-[#d9cdb0]",
  },
  reservee: {
    label: "Réservée",
    className: "border-violet-400/70 bg-violet-400/[0.08] text-violet-200",
    dotClassName: "bg-violet-400",
  },
  occupee: {
    label: "Occupée",
    className: "border-gold bg-gold text-[#16120a]",
    dotClassName: "bg-gold",
  },
  commande_en_cours: {
    label: "En préparation",
    className: "border-amber-400/80 bg-amber-400/[0.12] text-amber-200",
    dotClassName: "bg-amber-400",
  },
  commande_prete: {
    label: "Commande prête",
    className: "border-emerald-400/80 bg-emerald-400/[0.12] text-emerald-200",
    dotClassName: "bg-emerald-400",
  },
  paiement_demande: {
    label: "Addition demandée",
    className: "border-sky-400/80 bg-sky-400/[0.12] text-sky-200",
    dotClassName: "bg-sky-400",
  },
  a_nettoyer: {
    label: "À nettoyer",
    className: "border-dashed border-gold bg-transparent text-gold-soft",
    dotClassName: "bg-transparent ring-1 ring-gold",
  },
  indisponible: {
    label: "Hors service",
    className: "border-zinc-600 bg-zinc-700/20 text-zinc-400",
    dotClassName: "bg-zinc-500",
  },
};

function formatXAF(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardFloorPlan({ areas }: { areas: FloorArea[] }) {
  const firstArea = areas.find((area) => area.tables.length > 0) ?? areas[0];
  const [activeAreaId, setActiveAreaId] = useState(firstArea?.id ?? "");
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const activeArea = areas.find((area) => area.id === activeAreaId) ?? firstArea;
  const visibleTables =
    activeArea?.tables.filter((table) => !statusFilter || table.status === statusFilter) ?? [];
  const selectedTable = activeArea?.tables.find((table) => table.id === activeTableId);
  const visibleStatuses = [...new Set(areas.flatMap((area) => area.tables.map((table) => table.status)))];

  if (!activeArea) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted">
        Aucune table configurée.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1.5" aria-label="Choisir une zone">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => {
                setActiveAreaId(area.id);
                setActiveTableId(null);
              }}
              className={cn(
                "min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                activeArea.id === area.id
                  ? "border-gold/50 bg-gold/[0.1] text-gold-soft"
                  : "border-transparent text-muted hover:border-border-subtle hover:text-foreground"
              )}
            >
              {area.name}
              {area.isVip ? <span className="ml-1 text-[0.6rem] uppercase tracking-wider">VIP</span> : null}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Filtrer par statut">
          {visibleStatuses.slice(0, 6).map((status) => {
            const meta = statusMeta[status] ?? statusMeta.indisponible;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter((current) => (current === status ? null : status))}
                className={cn(
                  "flex min-h-8 items-center gap-1.5 text-[0.68rem] text-muted transition-colors hover:text-foreground",
                  statusFilter === status && "text-gold-soft"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-[0.2rem]", meta.dotClassName)} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dashboard-grid mt-4 rounded-xl border border-border-subtle bg-[#101012] p-4 sm:p-6">
        {visibleTables.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {visibleTables.map((table, index) => {
              const meta = statusMeta[table.status] ?? statusMeta.indisponible;
              const selected = activeTableId === table.id;
              const round = table.capacity <= 4 && index % 3 === 1;
              return (
                <button
                  key={table.id}
                  type="button"
                  aria-label={`${table.label}, ${meta.label}, ${table.capacity} places`}
                  aria-pressed={selected}
                  onClick={() => setActiveTableId((current) => (current === table.id ? null : table.id))}
                  className={cn(
                    "relative flex min-h-[5.2rem] flex-col items-center justify-center border text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    round ? "rounded-full" : "rounded-xl",
                    meta.className,
                    selected && "ring-2 ring-gold ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className="text-sm font-bold">{table.label}</span>
                  <span className="mt-1 flex items-center gap-1 text-[0.62rem] opacity-75">
                    <Users size={10} /> {table.capacity}
                  </span>
                  {table.orderAmount ? (
                    <span className="mt-1 max-w-[5.5rem] truncate text-[0.6rem] font-semibold">
                      {formatXAF(table.orderAmount)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted">Aucune table ne correspond à ce filtre.</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {selectedTable ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-semibold text-foreground">{selectedTable.label}</span>
            <span className="flex items-center gap-1 text-muted">
              <Users size={12} /> {selectedTable.capacity} places
            </span>
            {selectedTable.openedMinutes ? (
              <span className="flex items-center gap-1 text-muted">
                <Clock3 size={12} /> ouverte depuis {selectedTable.openedMinutes} min
              </span>
            ) : null}
            {selectedTable.orderAmount ? (
              <span className="font-semibold text-gold-soft">{formatXAF(selectedTable.orderAmount)}</span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted">Sélectionnez une table pour afficher son activité.</p>
        )}
        <Link
          href="/dashboard/salle"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gold transition-colors hover:text-gold-soft"
        >
          Gérer le plan <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
