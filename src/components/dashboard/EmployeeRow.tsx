"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { StatusSelect } from "./StatusSelect";
import {
  updateEmployeeRole,
  toggleEmployeeActive,
  setEmployeePin,
} from "@/lib/actions/dashboard/employees";
import { roleLabels } from "@/lib/dashboard-nav";
import type { EmployeeRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/site/SubmitButton";

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
  const [pinOpen, setPinOpen] = useState(false);
  const [pinState, pinAction] = useFormState(setEmployeePin, null);

  return (
    <tr>
      <td className="px-4 py-3" data-label="Nom">
        <Link
          href={`/dashboard/personnel/${employee.id}`}
          className="text-champagne transition-colors hover:text-gold hover:underline"
        >
          {employee.first_name} {employee.last_name}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted" data-label="Contact">
        <p>{employee.phone || "—"}</p>
        {employee.email ? <p className="text-xs">{employee.email}</p> : null}
      </td>
      <td className="px-4 py-3" data-label="Rôle">
        <StatusSelect
          value={employee.role}
          options={roleOptions}
          onChange={(role) => updateEmployeeRole(employee.id, role)}
        />
      </td>
      <td className="px-4 py-3" data-label="Statut">
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
      <td className="px-4 py-3" data-label="PIN">
        <button
          type="button"
          onClick={() => setPinOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-xs text-muted hover:border-gold hover:text-gold"
        >
          <KeyRound size={12} /> Code PIN
        </button>
        {pinOpen ? (
          <form action={pinAction} className="mt-2 flex items-center gap-1.5">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input
              name="pin"
              type="text"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              placeholder="4-6 chiffres"
              required
              className="w-24 rounded-md border border-border-subtle bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-gold"
            />
            <SubmitButton label="OK" pendingLabel="..." className="px-3 py-1.5 text-xs" />
          </form>
        ) : null}
        {pinOpen && pinState ? (
          <p className={cn("mt-1 text-[11px]", pinState.success ? "text-gold" : "text-red-400")}>
            {pinState.message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
