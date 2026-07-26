"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, UserRound } from "lucide-react";
import { PinPad } from "./PinPad";
import { loginWithPin } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type StaffMember = { id: string; firstName: string; lastName: string };

export function PinLoginForm({ staff }: { staff: StaffMember[] }) {
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePin(pin: string) {
    if (!selected) return;
    setError(null);
    const formData = new FormData();
    formData.set("employeeId", selected.id);
    formData.set("pin", pin);
    startTransition(async () => {
      const result = await loginWithPin(null, formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  if (!selected) {
    return (
      <div>
        <p className="mb-5 text-center text-sm text-muted">Qui êtes-vous ?</p>
        {staff.length === 0 ? (
          <p className="text-center text-xs text-muted">
            Aucun compte avec code PIN pour l&apos;instant.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {staff.map((member, i) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelected(member)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-pop-in flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-background px-3 py-4 text-center transition-all duration-150 [transition-timing-function:var(--ease-out-quart)] hover:border-gold hover:text-gold active:scale-95"
              >
                <UserRound size={20} className="text-gold" />
                <span className="text-xs text-champagne">
                  {member.firstName} {member.lastName.charAt(0)}.
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex w-full items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setError(null);
          }}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-gold"
        >
          <ChevronLeft size={14} /> Changer
        </button>
        <p className="text-sm text-champagne">
          {selected.firstName} {selected.lastName}
        </p>
        <span className="w-[52px]" aria-hidden />
      </div>
      <PinPad onSubmit={handlePin} submitting={isPending} error={error} />
    </div>
  );
}
