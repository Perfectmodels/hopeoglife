"use client";

import { useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinPad({
  length = 4,
  onSubmit,
  submitting,
  error,
}: {
  length?: number;
  onSubmit: (pin: string) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [pin, setPin] = useState("");

  function press(key: string) {
    if (submitting) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    setPin((p) => {
      const next = (p + key).slice(0, length);
      if (next.length === length) {
        onSubmit(next);
        return "";
      }
      return next;
    });
  }

  return (
    <div className="w-full max-w-[280px]">
      <div
        className={cn(
          "mb-4 flex items-center justify-center gap-3",
          error && "animate-shake"
        )}
      >
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-3 rounded-full border border-gold/50 transition-all duration-150 [transition-timing-function:var(--ease-out-quart)]",
              i < pin.length ? "scale-110 bg-gold" : "scale-100 bg-transparent"
            )}
          />
        ))}
      </div>

      {error ? <p className="mb-3 text-center text-xs text-red-400">{error}</p> : null}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) => (
          <button
            key={i}
            type="button"
            disabled={key === "" || submitting}
            onClick={() => press(key)}
            className={cn(
              "flex h-14 items-center justify-center rounded-xl border border-border-subtle text-lg text-champagne transition-all duration-150 [transition-timing-function:var(--ease-out-quart)] hover:border-gold hover:text-gold active:scale-90 disabled:opacity-0",
              key === "⌫" && "text-muted"
            )}
          >
            {key === "⌫" ? <Delete size={18} /> : key}
          </button>
        ))}
      </div>
    </div>
  );
}
