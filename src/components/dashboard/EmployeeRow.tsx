"use client";

import { useTransition } from "react";
import { StatusSelect } from "./StatusSelect";
import { updateEmployeeRole, toggleEmployeeActive } from "@/lib/actions/dashboard/employees";
import { roleLabels } from "@/lib/dashboard-nav";
import type { EmployeeRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  role: EmployeeRole;
  active: boolean;
};

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));

export function EmployeeRow({ employee }: { employee: Employee }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr>
      <td className="px-4 py-3 text-champagne">
        {employee.first_name} {employee.last_name}
      </td>
      <td className="px-4 py-3 text-muted">
        <p>{employee.phone || "—"}</p>
        {employee.email ? <p className="text-xs">{employee.email}</p> : null}
      </td>
      <td className="px-4 py-3">
        <StatusSelect
          value={employee.role}
          options={roleOptions}
          onChange={(role) => updateEmployeeRole(employee.id, role)}
        />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => toggleEmployeeActive(employee.id, !employee.active))}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs disabled:opacity-50",
            employee.active
              ? "border-emerald-500/40 text-emerald-400"
              : "border-red-500/40 text-red-400"
          )}
        >
          {employee.active ? "Actif" : "Inactif"}
        </button>
      </td>
    </tr>
  );
}
