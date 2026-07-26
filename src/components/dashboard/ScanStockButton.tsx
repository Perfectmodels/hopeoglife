"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { ScanStockModal } from "./ScanStockModal";

export function ScanStockButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-background transition-all duration-150 [transition-timing-function:var(--ease-out-quart)] hover:bg-gold-soft active:scale-95"
      >
        <ScanLine size={16} /> Scanner un produit
      </button>
      {open ? <ScanStockModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
