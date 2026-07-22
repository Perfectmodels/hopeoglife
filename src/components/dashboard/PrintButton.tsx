"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden flex w-full items-center justify-center gap-2 rounded-lg border border-gold/50 px-4 py-3 text-sm text-gold transition-colors hover:bg-gold/10"
    >
      <Printer size={16} />
      Imprimer le reçu
    </button>
  );
}
