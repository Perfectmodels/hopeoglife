import "server-only";

type ZXing = typeof import("@zxing/library");

export type DecodedBarcode = {
  text: string;
  format: string;
};

async function decodePixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  zxing: ZXing,
  productCodeFormats: number[]
): Promise<DecodedBarcode | null> {
  const {
    BarcodeFormat,
    BinaryBitmap,
    DecodeHintType,
    HybridBinarizer,
    MultiFormatReader,
    RGBLuminanceSource,
  } = zxing;
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, productCodeFormats);
  hints.set(DecodeHintType.TRY_HARDER, true);

  const source = new RGBLuminanceSource(pixels, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  reader.setHints(hints);

  try {
    const result = reader.decodeWithState(bitmap);
    return {
      text: result.getText().trim(),
      format: BarcodeFormat[result.getBarcodeFormat()] ?? "UNKNOWN",
    };
  } catch {
    return null;
  } finally {
    reader.reset();
  }
}

export async function decodeBarcodeImageBuffer(buffer: Buffer): Promise<DecodedBarcode | null> {
  // Ces dépendances ne sont nécessaires qu'au clic sur « Capturer ». Les charger
  // ici évite de les initialiser pendant la génération statique des pages Next.js.
  const [{ default: sharp }, zxing] = await Promise.all([
    import("sharp"),
    import("@zxing/library"),
  ]);
  const productCodeFormats = [
    zxing.BarcodeFormat.QR_CODE,
    zxing.BarcodeFormat.EAN_13,
    zxing.BarcodeFormat.EAN_8,
    zxing.BarcodeFormat.UPC_A,
    zxing.BarcodeFormat.UPC_E,
    zxing.BarcodeFormat.CODE_128,
    zxing.BarcodeFormat.CODE_39,
    zxing.BarcodeFormat.CODE_93,
    zxing.BarcodeFormat.CODABAR,
    zxing.BarcodeFormat.ITF,
    zxing.BarcodeFormat.DATA_MATRIX,
    zxing.BarcodeFormat.AZTEC,
    zxing.BarcodeFormat.PDF_417,
  ];
  const baseImage = sharp(buffer, { failOn: "error" })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .grayscale();

  const variants = [baseImage.clone(), baseImage.clone().normalize(), baseImage.clone().sharpen()];

  for (const image of variants) {
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const decoded = await decodePixels(
      new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      info.width,
      info.height,
      zxing,
      productCodeFormats
    );

    if (decoded?.text) return decoded;
  }

  return null;
}
