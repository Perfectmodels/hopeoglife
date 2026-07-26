"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Keyboard,
  PackageSearch,
  ScanLine,
  X,
} from "lucide-react";
import {
  createStockItem,
  decodeBarcodeCapture,
  lookupBarcode,
  recordStockMovement,
} from "@/lib/actions/dashboard/stock";
import type { BarcodeLookupResult } from "@/lib/actions/dashboard/stock";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "scanning" }
  | { kind: "capturing" }
  | { kind: "manual" }
  | { kind: "loading" }
  | { kind: "result"; code: string; result: BarcodeLookupResult }
  | { kind: "done"; message: string };

type NativeBarcodeDetector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function isExpectedDecodeMiss(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    name?: string;
    constructor?: { name?: string };
    getKind?: () => string;
  };
  let kind: string | undefined;

  try {
    kind = candidate.getKind?.();
  } catch {
    // Certaines versions de ZXing n'exposent pas getKind de façon fiable.
  }

  const names = [kind, candidate.name, candidate.constructor?.name];
  return names.some(
    (name) =>
      name === "NotFoundException" ||
      name === "ChecksumException" ||
      name === "FormatException"
  );
}

function useBarcodeScanner(active: boolean, onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    setError(null);
    setIsReady(false);
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
      BarcodeFormat.PDF_417,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 500,
    });
    let controls: IScannerControls | null = null;
    let nativeScanTimer: ReturnType<typeof setInterval> | null = null;
    let nativeScanPending = false;
    let stopped = false;

    const finishScan = (code: string, scanControls?: IScannerControls) => {
      if (stopped || !code.trim()) return;

      stopped = true;
      if (nativeScanTimer) clearInterval(nativeScanTimer);
      if (scanControls) {
        scanControls.stop();
      } else {
        controls?.stop();
      }
      onDetected(code.trim());
    };

    const startNativeDetector = () => {
      const Detector = (
        window as typeof window & {
          BarcodeDetector?: new (options?: { formats?: string[] }) => NativeBarcodeDetector;
        }
      ).BarcodeDetector;
      const video = videoRef.current;

      if (!Detector || !video) return;

      let detector: NativeBarcodeDetector;
      try {
        detector = new Detector({
          formats: [
            "qr_code",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "codabar",
            "itf",
            "data_matrix",
          ],
        });
      } catch {
        detector = new Detector();
      }

      nativeScanTimer = setInterval(async () => {
        if (stopped || nativeScanPending || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          return;
        }

        nativeScanPending = true;
        try {
          const [barcode] = await detector.detect(video);
          if (barcode?.rawValue) finishScan(barcode.rawValue);
        } catch {
          // ZXing reste actif si le détecteur natif n'est pas utilisable sur cet appareil.
        } finally {
          nativeScanPending = false;
        }
      }, 200);
    };

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current!,
        (result, scanError, scanControls) => {
          if (result && !stopped) {
            finishScan(result.getText(), scanControls);
            return;
          }

          if (scanError && !isExpectedDecodeMiss(scanError) && !stopped) {
            setError("La lecture de l'image s'est arrêtée. Fermez puis rouvrez le scanner.");
          }
        }
      )
      .then((c) => {
        controls = c;
        if (stopped) {
          c.stop();
        } else {
          setIsReady(true);
          startNativeDetector();
        }
      })
      .catch((cameraError: unknown) => {
        if (!stopped) {
          const errorName =
            cameraError instanceof DOMException ? cameraError.name : "CameraError";
          setError(
            errorName === "NotAllowedError"
              ? "Accès à la caméra refusé. Autorisez la caméra dans les réglages du navigateur."
              : "Impossible de démarrer la caméra. Fermez les autres applications qui l'utilisent."
          );
        }
      });

    return () => {
      stopped = true;
      setIsReady(false);
      if (nativeScanTimer) clearInterval(nativeScanTimer);
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, error, isReady };
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
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    videoRef,
    error: cameraError,
    isReady: cameraReady,
  } = useBarcodeScanner(step.kind === "scanning", (code) => {
    runLookup(code);
  });

  function runLookup(code: string) {
    setStep({ kind: "loading" });
    startTransition(async () => {
      const result = await lookupBarcode(code);
      setStep({ kind: "result", code, result });
    });
  }

  async function captureAndDecode() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCaptureError("La caméra n'est pas encore prête.");
      return;
    }

    setCaptureError(null);

    const sourceSize = Math.min(video.videoWidth, video.videoHeight);
    const outputSize = Math.min(sourceSize, 1280);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) {
      setCaptureError("Impossible de préparer la capture.");
      return;
    }

    context.drawImage(
      video,
      (video.videoWidth - sourceSize) / 2,
      (video.videoHeight - sourceSize) / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const image = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!image) {
      setCaptureError("Impossible d'enregistrer la capture.");
      return;
    }

    setStep({ kind: "capturing" });
    const formData = new FormData();
    formData.set("image", image, "capture-code-produit.jpg");
    const result = await decodeBarcodeCapture(formData);

    if (result.success) {
      runLookup(result.code);
    } else {
      setCaptureError(result.message);
      setStep({ kind: "scanning" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-border-subtle bg-background-elevated p-4 sm:p-6">
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
            <div className="relative h-[min(52dvh,20rem)] min-h-40 overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-gold/60" />
              <button
                type="button"
                disabled={!cameraReady}
                onClick={captureAndDecode}
                className="absolute bottom-4 left-1/2 z-10 flex min-h-11 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-xs font-semibold text-background shadow-lg ring-4 ring-black/35 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Capturer le code et l'analyser"
              >
                <Camera size={15} /> Capturer
              </button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ScanLine size={13} /> Visez le QR code ou le code-barres du produit
            </p>
            {cameraReady && !cameraError ? (
              <p className="mt-1 text-center text-[11px] text-emerald-400">
                Caméra prête — lecture en cours
              </p>
            ) : null}
            {captureError ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" /> {captureError}
              </p>
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

        {step.kind === "capturing" ? (
          <div className="py-10 text-center">
            <Camera size={28} className="mx-auto mb-3 animate-pulse text-gold" />
            <p className="text-sm text-champagne">Analyse de la capture...</p>
            <p className="mt-1 text-xs text-muted">ZXing recherche le code sur le serveur.</p>
          </div>
        ) : null}

        {step.kind === "manual" ? (
          <div className="space-y-3">
            <FormField label="QR code ou code-barres" htmlFor="manual-barcode">
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
