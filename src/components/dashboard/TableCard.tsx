"use client";

import { Users } from "lucide-react";
import { StatusSelect } from "./StatusSelect";
import { StatusBadge } from "./StatusBadge";
import { updateTableStatus } from "@/lib/actions/dashboard/tables";
import { tableStatuses, toOptions } from "@/lib/statuses";

type Table = {
  id: string;
  label: string;
  capacity: number;
  status: string;
};

export function TableCard({ table }: { table: Table }) {
  const config = tableStatuses[table.status] ?? { label: table.status, tone: "neutral" as const };

  return (
    <div className="rounded-2xl border border-border-subtle bg-background-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg text-champagne">{table.label}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Users size={12} /> {table.capacity} places
          </p>
        </div>
        <StatusBadge label={config.label} tone={config.tone} />
      </div>
      <div className="mt-4">
        <StatusSelect
          value={table.status}
          options={toOptions(tableStatuses)}
          onChange={(status) => updateTableStatus(table.id, status)}
          className="w-full"
        />
      </div>
    </div>
  );
}
