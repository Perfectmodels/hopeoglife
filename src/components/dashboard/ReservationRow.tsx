"use client";

import { useTransition } from "react";
import { StatusSelect } from "./StatusSelect";
import { updateReservationStatus, assignReservationTable } from "@/lib/actions/dashboard/reservations";

type Reservation = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  party_size: number;
  reservation_time: string;
  occasion: string | null;
  special_requests: string | null;
  status: string;
  table_id: string | null;
};

export function ReservationRow({
  reservation,
  statusOptions,
  tableOptions,
}: {
  reservation: Reservation;
  statusOptions: { value: string; label: string }[];
  tableOptions: { id: string; label: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-champagne">{reservation.reservation_time?.slice(0, 5)}</td>
      <td className="px-4 py-3">
        <p className="text-champagne">
          {reservation.first_name} {reservation.last_name}
        </p>
        {reservation.special_requests ? (
          <p className="mt-1 max-w-xs text-xs text-muted">{reservation.special_requests}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-muted">
        <p>{reservation.phone}</p>
        {reservation.email ? <p className="text-xs">{reservation.email}</p> : null}
      </td>
      <td className="px-4 py-3 text-muted">{reservation.party_size}</td>
      <td className="px-4 py-3 text-muted">{reservation.occasion || "—"}</td>
      <td className="px-4 py-3">
        <select
          defaultValue={reservation.table_id ?? ""}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.value || null;
            startTransition(() => {
              assignReservationTable(reservation.id, value);
            });
          }}
          className="rounded-lg border border-border-subtle bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold disabled:opacity-50"
        >
          <option value="">Non assignée</option>
          {tableOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <StatusSelect
          value={reservation.status}
          options={statusOptions}
          onChange={(status) => updateReservationStatus(reservation.id, status)}
        />
      </td>
    </tr>
  );
}
