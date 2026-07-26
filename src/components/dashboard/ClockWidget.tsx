"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, LogIn, LogOut as ClockOutIcon } from "lucide-react";
import { clockIn, clockOut, getMyAttendanceStatus } from "@/lib/actions/dashboard/attendance";
import { cn } from "@/lib/utils";

export function ClockWidget() {
  const [status, setStatus] = useState<{ open: boolean; clockIn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyAttendanceStatus().then(setStatus);
  }, []);

  function handleClock() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Géolocalisation indisponible sur cet appareil.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        startTransition(async () => {
          const action = status?.open ? clockOut : clockIn;
          const result = await action(latitude, longitude);
          if (result.success) {
            const next = await getMyAttendanceStatus();
            setStatus(next);
          } else {
            setError(result.message);
          }
        });
      },
      () => {
        setError("Position refusée ou indisponible. Autorisez la géolocalisation pour pointer.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (!status) return null;

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClock}
        disabled={isPending}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-150 [transition-timing-function:var(--ease-out-quart)] active:scale-95 disabled:opacity-50",
          status.open
            ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            : "border-gold/50 text-gold hover:bg-gold/10"
        )}
      >
        {status.open ? <ClockOutIcon size={13} /> : <LogIn size={13} />}
        {isPending
          ? "..."
          : status.open
            ? `En service depuis ${new Date(status.clockIn!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
            : "Pointer l'arrivée"}
      </button>
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400">
          <MapPin size={11} /> {error}
        </p>
      ) : null}
    </div>
  );
}
