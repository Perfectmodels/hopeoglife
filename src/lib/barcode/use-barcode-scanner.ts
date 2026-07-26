"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

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

export function useBarcodeScanner(active: boolean, onDetected: (code: string) => void) {
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
