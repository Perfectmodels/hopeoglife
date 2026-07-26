import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReceiptBuilder, type ReceiptLine } from "@/components/dashboard/ReceiptBuilder";

export const metadata = { title: "Réception" };

export default async function ReceptionDetailPage({ params }: { params: { id: string } }) {
  await requireRole("/dashboard/stock/receptions");

  const supabase = createAdminClient();
  const [{ data: receipt }, { data: stockItems }, { data: suppliers }, { data: locations }] =
    await Promise.all([
      supabase
        .from("stock_receipts")
        .select(
          "id, receipt_number, status, supplier_id, invoice_number, stock_location_id, notes, stock_receipt_items(id, stock_item_id, quantity_received, unit_cost, batch_number, manufacturing_date, expiration_date, stock_location_id, condition, comment, stock_items(name, unit))"
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase.from("stock_items").select("id, name, unit").order("name", { ascending: true }),
      supabase.from("suppliers").select("id, name").order("name", { ascending: true }),
      supabase.from("stock_locations").select("id, name").order("name", { ascending: true }),
    ]);

  if (!receipt) notFound();

  const initialLines: ReceiptLine[] = (
    receipt.stock_receipt_items as unknown as Array<{
      stock_item_id: string;
      quantity_received: number;
      unit_cost: number | null;
      batch_number: string | null;
      manufacturing_date: string | null;
      expiration_date: string | null;
      stock_location_id: string | null;
      condition: "bon" | "abime" | "perime" | null;
      comment: string | null;
      stock_items: { name: string; unit: string } | null;
    }>
  ).map((item) => ({
    stockItemId: item.stock_item_id,
    name: item.stock_items?.name ?? "—",
    unit: item.stock_items?.unit ?? "",
    quantityReceived: Number(item.quantity_received),
    unitCost: item.unit_cost ?? undefined,
    batchNumber: item.batch_number ?? undefined,
    manufacturingDate: item.manufacturing_date ?? undefined,
    expirationDate: item.expiration_date ?? undefined,
    stockLocationId: item.stock_location_id ?? undefined,
    condition: item.condition ?? undefined,
    comment: item.comment ?? undefined,
  }));

  return (
    <div>
      <PageHeader
        title={`Réception ${receipt.receipt_number}`}
        description={
          receipt.status === "brouillon"
            ? "Brouillon — modifiez les lignes puis validez pour mettre à jour le stock."
            : "Réception validée — le stock a déjà été mis à jour."
        }
      />
      <ReceiptBuilder
        mode={receipt.status === "brouillon" ? "edit" : "readonly"}
        receiptId={receipt.id}
        receiptNumber={receipt.receipt_number}
        initialSupplierId={receipt.supplier_id ?? undefined}
        initialInvoiceNumber={receipt.invoice_number ?? undefined}
        initialLocationId={receipt.stock_location_id ?? undefined}
        initialNotes={receipt.notes ?? undefined}
        initialLines={initialLines}
        stockItems={stockItems ?? []}
        suppliers={suppliers ?? []}
        locations={locations ?? []}
      />
    </div>
  );
}
