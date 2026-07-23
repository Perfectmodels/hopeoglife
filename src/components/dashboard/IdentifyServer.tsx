"use client";

import { useState, useTransition } from "react";
import { UserCircle2 } from "lucide-react";
import { PinPad } from "./PinPad";
import { identifyByPin } from "@/lib/actions/dashboard/employees";

type Identified = { id: string; firstName: string; lastName: string };

export function IdentifyServer({
  value,
  onChange,
}: {
  value: Identified | null;
  onChange: (employee: Identified | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePin(pin: string) {
    setError(null);
    startTransition(async () => {
      const result = await identifyByPin(pin);
      if (result.success) {
        onChange(result.employee);
        setOpen(false);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-background-elevated px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <UserCircle2 size={18} className="text-gold" />
        {value ? (
          <span className="text-champagne">
            Commande prise par <strong>{value.firstName} {value.lastName}</strong>
          </span>
        ) : (
          <span className="text-muted">Aucun serveur identifié</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="shrink-0 rounded-full border border-border-subtle px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
      >
        {value ? "Changer" : "S'identifier"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-background-elevated p-8">
            <p className="mb-6 text-center font-display text-lg text-champagne">
              Entrez votre code PIN
            </p>
            <div className="flex justify-center">
              <PinPad onSubmit={handlePin} submitting={isPending} error={error} />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full text-center text-xs text-muted hover:text-gold"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
