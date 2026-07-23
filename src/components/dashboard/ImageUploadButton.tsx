"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadMenuImage } from "@/lib/actions/dashboard/menu";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 5;

export function ImageUploadButton({
  pathPrefix,
  onUploaded,
  className,
  label = "Ajouter une photo",
}: {
  pathPrefix: string;
  onUploaded: (url: string) => void;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`L'image doit faire moins de ${MAX_SIZE_MB} Mo.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.set("file", file);
      body.set("pathPrefix", pathPrefix);

      const result = await uploadMenuImage(body);

      if (!result.success) {
        setError(result.message);
        return;
      }

      onUploaded(result.url);
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
        )}
      >
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
        {uploading ? "Envoi..." : label}
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
