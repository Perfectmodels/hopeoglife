"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AlertCircle, CheckCircle2, Keyboard, PackageSearch, ScanLine, X } from "lucide-react";
import { lookupBarcode, createStockItem, recordStockMovement } from "@/lib/actions/dashboard/stock";
import type { BarcodeLookupResult } from "@/lib/actions/dashboard/stock";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "scanning" }
  | { kind: "manual" }
  | { kind: "loading" }
  | { kind: "result"; code: string; result: BarcodeLookupResult }
  | { kind: "done"; message: string };

function useBarcodeScanner(active: boolean, onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: IScannerControls | null = null;
    let stopped = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result) => {
          if (result && !stopped) {
            stopped = true;
            controls?.stop();
            onDetected(result.getText());
          }
        }
      )
      .then((c) => {
        controls = c;
      })
      .catch(() => {
        setError("Impossible d'accéder à la caméra. Autorisez-la ou saisissez le code manuellement.");
      });

    return () => {
      stopped = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, error };
}

function ExistingItemForm({
  item,
  onDone,
}: {
  item: Extract<BarcodeLookupResult, { status: "existing" }>["item"];
  onDone: (message: string) => void;
}) {
  const [state, formAction] = useFormState(recordStockMovement, null);

  useEffect(() => {
    if (state?.success) onDone(state.message);
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="stockItemId" value={item.id} />
      <input type="hidden" name="type" value="entree" />
      <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-background p-4">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-background-elevated text-gold">
            <PackageSearch size={22} />
          </div>
        )}
        <div>
          <p className="font-display text-champagne">{item.name}</p>
          <p className="text-xs text-muted">
            En stock : {item.quantityOnHand} {item.unit}
          </p>
        </div>
      </div>
      <FormField label={`Quantité à ajouter (${item.unit})`} htmlFor="scan-qty-existing">
        <input
          id="scan-qty-existing"
          name="quantity"
          type="number"
          min={0.01}
          step="0.01"
          required
          defaultValue={1}
          className={inputClasses}
        />
      </FormField>
      <SubmitButton label="Ajouter au stock" pendingLabel="Ajout..." className="w-full" />
      {state && !state.success ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} /> {state.message}
        </p>
      ) : null}
    </form>
  );
}

function NewItemForm({
  code,
  name,
  imageUrl,
  onDone,
}: {
  code: string;
  name: string;
  imageUrl: string | null;
  onDone: (message: string) => void;
}) {
  const [state, formAction] = useFormState(createStockItem, null);

  useEffect(() => {
    if (state?.success) onDone(state.message);
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="barcode" value={code} />
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={400}
          height={200}
          className="h-32 w-full rounded-xl object-cover"
        />
      ) : null}
      <FormField label="Nom du produit" htmlFor="scan-name">
        <input id="scan-name" name="name" defaultValue={name} required className={inputClasses} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Unité" htmlFor="scan-unit">
          <input
            id="scan-unit"
            name="unit"
            placeholder="unité, canette..."
            defaultValue="unité"
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Catégorie (optionnel)" htmlFor="scan-category">
          <input id="scan-category" name="category" className={inputClasses} />
        </FormField>
      </div>
      <FormField label="Quantité initiale" htmlFor="scan-qty-new">
        <input
          id="scan-qty-new"
          name="quantityOnHand"
          type="number"
          min={0}
          step="0.01"
          defaultValue={1}
          className={inputClasses}
        />
      </FormField>
      <input type="hidden" name="lowStockThreshold" value={0} />
      <SubmitButton label="Créer et ajouter au stock" pendingLabel="Création..." className="w-full" />
      {state && !state.success ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} /> {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ScanStockModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const { videoRef, error: cameraError } = useBarcodeScanner(step.kind === "scanning", (code) => {
    runLookup(code);
  });

  function runLookup(code: string) {
    setStep({ kind: "loading" });
    startTransition(async () => {
      const result = await lookupBarcode(code);
      setStep({ kind: "result", code, result });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-background-elevated p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg text-champagne">Scanner un produit</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted transition-colors hover:text-gold"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {step.kind === "scanning" ? (
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-gold/60" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ScanLine size={13} /> Visez le code-barres du produit
            </p>
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
            <FormField label="Code-barres" htmlFor="manual-barcode">
              <input
                id="manual-barcode"
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
              onClick={() => runLookup(manualCode.trim())}
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

        {step.kind === "loading" ? (
          <p className="py-10 text-center text-sm text-muted">Recherche du produit...</p>
        ) : null}

        {step.kind === "result" && step.result.status === "existing" ? (
          <ExistingItemForm
            item={step.result.item}
            onDone={(message) => setStep({ kind: "done", message })}
          />
        ) : null}

        {step.kind === "result" && step.result.status === "external" ? (
          <NewItemForm
            code={step.code}
            name={step.result.name}
            imageUrl={step.result.imageUrl}
            onDone={(message) => setStep({ kind: "done", message })}
          />
        ) : null}

        {step.kind === "result" && step.result.status === "not_found" ? (
          <div>
            <p className="mb-4 text-sm text-muted">
              Produit non reconnu pour le code <span className="text-champagne">{step.code}</span>.
              Vous pouvez le créer manuellement.
            </p>
            <NewItemForm
              code={step.code}
              name=""
              imageUrl={null}
              onDone={(message) => setStep({ kind: "done", message })}
            />
          </div>
        ) : null}

        {step.kind === "done" ? (
          <div className="animate-pop-in py-6 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-gold" />
            <p className="text-sm text-champagne">{step.message}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep({ kind: "scanning" })}
                className="flex-1 rounded-full border border-border-subtle py-2.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Scanner un autre produit
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-gold py-2.5 text-xs font-medium text-background transition-colors hover:bg-gold-soft"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
