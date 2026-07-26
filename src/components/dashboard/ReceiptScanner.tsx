"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import {
  AlertCircle,
  Camera,
  Keyboard,
  PackageSearch,
  Repeat,
  ScanLine,
  Hash,
} from "lucide-react";
import {
  scanReceiptBarcode,
  associateBarcodeToProduct,
  createEnrichedStockItem,
  type ScanReceiptResult,
} from "@/lib/actions/dashboard/stock-receipts";
import { useBarcodeScanner } from "@/lib/barcode/use-barcode-scanner";
import { playScanSuccess, playScanError } from "@/lib/barcode/scan-feedback";
import { FormField, inputClasses } from "@/components/site/FormField";
import { SubmitButton } from "@/components/site/SubmitButton";
import { cn } from "@/lib/utils";
import type { ReceiptLine } from "./ReceiptBuilder";

type Step =
  | { kind: "scanning" }
  | { kind: "manual" }
  | { kind: "loading" }
  | { kind: "quantity"; stockItemId: string; name: string; unit: string; barcodeId: string; suggestedQuantity: number }
  | { kind: "duplicate"; result: Extract<ScanReceiptResult, { status: "similar" }> }
  | { kind: "creating"; code: string; name: string; imageUrl: string | null };

export function ReceiptScanner({
  defaultLocationId,
  onAddLine,
}: {
  defaultLocationId?: string;
  onAddLine: (line: ReceiptLine) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState<"repeat" | "single">("repeat");
  const [flash, setFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { videoRef, error: cameraError, isReady: cameraReady } = useBarcodeScanner(
    step.kind === "scanning",
    (code) => runLookup(code)
  );

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [flash]);

  function runLookup(code: string) {
    setStep({ kind: "loading" });
    startTransition(async () => {
      const result = await scanReceiptBarcode(code);
      handleResult(code, result);
    });
  }

  function handleResult(code: string, result: ScanReceiptResult) {
    if (result.status === "existing") {
      playScanSuccess();
      const quantity = result.packaging?.unitsPerPackage ?? 1;

      if (scanMode === "single") {
        setStep({
          kind: "quantity",
          stockItemId: result.stockItemId,
          name: result.name,
          unit: result.unit,
          barcodeId: result.barcodeId,
          suggestedQuantity: quantity,
        });
        return;
      }

      onAddLine({
        stockItemId: result.stockItemId,
        name: result.name,
        unit: result.unit,
        quantityReceived: quantity,
        stockLocationId: defaultLocationId,
      });
      setFlash(
        result.packaging
          ? `${result.name} — +${quantity} ${result.unit} (${result.packaging.name})`
          : `${result.name} — +${quantity} ${result.unit}`
      );
      setStep({ kind: "scanning" });
      return;
    }

    playScanError();

    if (result.status === "similar") {
      setStep({ kind: "duplicate", result });
      return;
    }

    if (result.status === "external") {
      setStep({ kind: "creating", code, name: result.name, imageUrl: result.imageUrl });
      return;
    }

    setStep({ kind: "creating", code, name: "", imageUrl: null });
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-background-elevated p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-base text-champagne">
          <ScanLine size={18} className="text-gold" /> Scanner des produits
        </p>
        <div className="flex items-center gap-1 rounded-full border border-border-subtle p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setScanMode("repeat")}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
              scanMode === "repeat" ? "bg-gold/10 text-gold" : "text-muted"
            )}
          >
            <Repeat size={12} /> Scan répété
          </button>
          <button
            type="button"
            onClick={() => setScanMode("single")}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
              scanMode === "single" ? "bg-gold/10 text-gold" : "text-muted"
            )}
          >
            <Hash size={12} /> Scan unique + quantité
          </button>
        </div>
      </div>

      {step.kind === "scanning" || step.kind === "loading" ? (
        <div>
          <div className="relative h-[min(46dvh,18rem)] min-h-40 overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-gold/60" />
            {flash ? (
              <div className="animate-pop-in absolute inset-x-3 top-3 rounded-lg bg-gold/90 px-3 py-2 text-center text-xs font-medium text-background">
                {flash}
              </div>
            ) : null}
            {step.kind === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-champagne">
                Recherche du produit...
              </div>
            ) : null}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Camera size={13} /> Visez le code-barres ou QR code — douchette USB/Bluetooth compatible
          </p>
          {cameraReady && !cameraError ? (
            <p className="mt-1 text-center text-[11px] text-emerald-400">Caméra prête — lecture en cours</p>
          ) : null}
          {cameraError ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={14} className="shrink-0" /> {cameraError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setStep({ kind: "manual" })}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-border-subtle py-2 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
          >
            <Keyboard size={13} /> Saisir le code manuellement
          </button>
        </div>
      ) : null}

      {step.kind === "manual" ? (
        <div className="space-y-3">
          <FormField label="Code-barres ou QR code" htmlFor="rs-manual">
            <input
              id="rs-manual"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              inputMode="numeric"
              placeholder="Ex: 5449000000996"
              className={inputClasses}
              autoFocus
            />
          </FormField>
          <button
            type="button"
            disabled={!manualCode.trim() || isPending}
            onClick={() => {
              const code = manualCode.trim();
              setManualCode("");
              runLookup(code);
            }}
            className="w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-soft disabled:opacity-50"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={() => setStep({ kind: "scanning" })}
            className="w-full text-center text-xs text-muted hover:text-gold"
          >
            ← Revenir à la caméra
          </button>
        </div>
      ) : null}

      {step.kind === "quantity" ? (
        <QuantityStep
          stockItemId={step.stockItemId}
          name={step.name}
          unit={step.unit}
          suggestedQuantity={step.suggestedQuantity}
          onConfirm={(quantity) => {
            onAddLine({
              stockItemId: step.stockItemId,
              name: step.name,
              unit: step.unit,
              quantityReceived: quantity,
              stockLocationId: defaultLocationId,
            });
            setFlash(`${step.name} — +${quantity} ${step.unit}`);
            setStep({ kind: "scanning" });
          }}
          onCancel={() => setStep({ kind: "scanning" })}
        />
      ) : null}

      {step.kind === "duplicate" ? (
        <DuplicateAlert
          result={step.result}
          onAssociated={(stockItemId, name, unit) => {
            const quantity = 1;
            onAddLine({
              stockItemId,
              name,
              unit,
              quantityReceived: quantity,
              stockLocationId: defaultLocationId,
            });
            setFlash(`${name} — +${quantity} ${unit}`);
            setStep({ kind: "scanning" });
          }}
          onCreateNew={() =>
            setStep({
              kind: "creating",
              code: step.result.code,
              name: step.result.suggestedName ?? "",
              imageUrl: step.result.suggestedImageUrl,
            })
          }
          onCancel={() => setStep({ kind: "scanning" })}
        />
      ) : null}

      {step.kind === "creating" ? (
        <CreateItemForm
          code={step.code}
          name={step.name}
          imageUrl={step.imageUrl}
          onDone={(stockItemId, name, unit, quantity) => {
            onAddLine({
              stockItemId,
              name,
              unit,
              quantityReceived: quantity,
              stockLocationId: defaultLocationId,
            });
            setFlash(`${name} — +${quantity} ${unit}`);
            setStep({ kind: "scanning" });
          }}
          onCancel={() => setStep({ kind: "scanning" })}
        />
      ) : null}
    </div>
  );
}

function QuantityStep({
  name,
  unit,
  suggestedQuantity,
  onConfirm,
  onCancel,
}: {
  stockItemId: string;
  name: string;
  unit: string;
  suggestedQuantity: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}) {
  const [quantity, setQuantity] = useState(String(suggestedQuantity));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background-elevated text-gold">
          <PackageSearch size={20} />
        </div>
        <p className="font-display text-champagne">{name}</p>
      </div>
      <FormField label={`Quantité reçue (${unit})`} htmlFor="rs-qty">
        <input
          id="rs-qty"
          type="number"
          min={0.01}
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={inputClasses}
          autoFocus
        />
      </FormField>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-border-subtle py-2.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!(Number(quantity) > 0)}
          onClick={() => onConfirm(Number(quantity))}
          className="flex-1 rounded-full bg-gold py-2.5 text-xs font-medium text-background transition-colors hover:bg-gold-soft disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

function DuplicateAlert({
  result,
  onAssociated,
  onCreateNew,
  onCancel,
}: {
  result: Extract<ScanReceiptResult, { status: "similar" }>;
  onAssociated: (stockItemId: string, name: string, unit: string) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function associate(candidate: { id: string; name: string; unit: string }) {
    setPending(true);
    setError(null);
    const result_ = await associateBarcodeToProduct(candidate.id, result.code);
    setPending(false);
    if (result_.success) {
      onAssociated(candidate.id, candidate.name, candidate.unit);
    } else {
      setError(result_.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <p className="text-sm text-champagne">Un produit similaire existe déjà.</p>
        {result.suggestedName ? (
          <p className="mt-1 text-xs text-muted">Suggestion détectée : {result.suggestedName}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {result.candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3"
          >
            <span className="text-sm text-champagne">{candidate.name}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => associate(candidate)}
              className="rounded-full border border-gold/50 px-3 py-1.5 text-[11px] uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              Associer ce code
            </button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} /> {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-border-subtle py-2.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="flex-1 rounded-full border border-gold/50 py-2.5 text-xs text-gold transition-colors hover:bg-gold/10"
        >
          Créer un nouveau produit
        </button>
      </div>
    </div>
  );
}

function CreateItemForm({
  code,
  name,
  imageUrl,
  onDone,
  onCancel,
}: {
  code: string;
  name: string;
  imageUrl: string | null;
  onDone: (stockItemId: string, name: string, unit: string, quantity: number) => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useFormState(createEnrichedStockItem, null);
  const [unit, setUnit] = useState("unité");
  const [isPackaging, setIsPackaging] = useState(false);
  const [unitsPerPackage, setUnitsPerPackage] = useState("1");

  useEffect(() => {
    if (state?.success && state.stockItemId) {
      const quantity = isPackaging ? Number(unitsPerPackage) || 1 : 1;
      onDone(state.stockItemId, name, unit, quantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="barcode" value={code} />
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      <input type="hidden" name="quantityOnHand" value={0} />
      <input type="hidden" name="lowStockThreshold" value={0} />
      <p className="text-xs text-muted">
        Code-barres inconnu <span className="text-champagne">{code}</span> — créez la fiche produit.
      </p>
      {imageUrl ? (
        <Image src={imageUrl} alt={name} width={400} height={160} className="h-28 w-full rounded-xl object-cover" />
      ) : null}
      <FormField label="Nom du produit" htmlFor="rs-new-name">
        <input id="rs-new-name" name="name" defaultValue={name} required className={inputClasses} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Unité" htmlFor="rs-new-unit">
          <input
            id="rs-new-unit"
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Catégorie" htmlFor="rs-new-category">
          <input id="rs-new-category" name="category" className={inputClasses} />
        </FormField>
        <FormField label="Sous-catégorie (optionnel)" htmlFor="rs-new-subcategory">
          <input id="rs-new-subcategory" name="subcategory" className={inputClasses} />
        </FormField>
        <FormField label="Marque (optionnel)" htmlFor="rs-new-brand">
          <input id="rs-new-brand" name="brand" className={inputClasses} />
        </FormField>
        <FormField label="Contenance (optionnel)" htmlFor="rs-new-content">
          <input id="rs-new-content" name="contentSize" placeholder="Ex: 33 cl" className={inputClasses} />
        </FormField>
        <FormField label="Destination" htmlFor="rs-new-destination">
          <select id="rs-new-destination" name="destination" className={inputClasses} defaultValue="">
            <option value="">—</option>
            <option value="bar">Bar</option>
            <option value="cuisine">Cuisine</option>
            <option value="reserve">Réserve</option>
          </select>
        </FormField>
        <FormField label="Prix d'achat (optionnel)" htmlFor="rs-new-purchase">
          <input id="rs-new-purchase" name="purchasePrice" type="number" min={0} step="0.01" className={inputClasses} />
        </FormField>
        <FormField label="Prix de vente (optionnel)" htmlFor="rs-new-sale">
          <input id="rs-new-sale" name="salePrice" type="number" min={0} step="0.01" className={inputClasses} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={isPackaging}
          onChange={(e) => setIsPackaging(e.target.checked)}
          className="rounded border-border-subtle"
        />
        Ce code correspond à un pack/carton (pas à une unité)
      </label>
      {isPackaging ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nom du conditionnement" htmlFor="rs-new-pkgname">
            <input
              id="rs-new-pkgname"
              name="packagingName"
              placeholder="Ex: Carton de 24"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Unités contenues" htmlFor="rs-new-pkgunits">
            <input
              id="rs-new-pkgunits"
              name="unitsPerPackage"
              type="number"
              min={1}
              step="1"
              value={unitsPerPackage}
              onChange={(e) => setUnitsPerPackage(e.target.value)}
              className={inputClasses}
            />
          </FormField>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="isSellable" defaultChecked className="rounded border-border-subtle" />
        Produit vendable (décocher pour un ingrédient interne)
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="expirationTracked" className="rounded border-border-subtle" />
        Suivre la date d&apos;expiration pour ce produit
      </label>

      {state && !state.success ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} /> {state.message}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-border-subtle py-2.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Annuler
        </button>
        <SubmitButton label="Créer et ajouter" pendingLabel="Création..." className="flex-1" />
      </div>
    </form>
  );
}
