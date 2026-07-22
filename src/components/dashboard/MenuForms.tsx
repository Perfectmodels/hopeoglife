"use client";

import { useId, useState } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createCategory, createMenuItem } from "@/lib/actions/dashboard/menu";
import { ImageUploadButton } from "./ImageUploadButton";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

function Result({ state }: { state: { success: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
        state.success
          ? "border-gold/40 bg-gold/5 text-champagne"
          : "border-red-500/40 bg-red-500/5 text-red-300"
      }`}
    >
      {state.success ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-gold" />
      ) : (
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <p>{state.message}</p>
    </div>
  );
}

export function NewCategoryForm() {
  const [state, formAction] = useFormState(createCategory, null);
  return (
    <form action={formAction} className="space-y-3">
      <FormField label="Nom de la catégorie" htmlFor="cat-name">
        <input id="cat-name" name="name" required className={inputClasses} />
      </FormField>
      <FormField label="Type" htmlFor="cat-kind">
        <select id="cat-kind" name="kind" defaultValue="restaurant" className={inputClasses}>
          <option value="restaurant">Restaurant</option>
          <option value="bar">Bar</option>
        </select>
      </FormField>
      <SubmitButton label="Ajouter la catégorie" pendingLabel="Ajout..." className="w-full" />
      <Result state={state} />
    </form>
  );
}

export function NewItemForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(createMenuItem, null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const uploadId = useId();

  return (
    <form action={formAction} className="space-y-3">
      <FormField label="Catégorie" htmlFor="item-category">
        <select id="item-category" name="categoryId" required className={inputClasses} defaultValue="">
          <option value="" disabled>
            Sélectionnez une catégorie
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Nom du produit" htmlFor="item-name">
        <input id="item-name" name="name" required className={inputClasses} />
      </FormField>
      <FormField label="Description (optionnel)" htmlFor="item-description">
        <input id="item-description" name="description" className={inputClasses} />
      </FormField>
      <FormField label="Prix (XAF)" htmlFor="item-price">
        <input id="item-price" name="price" type="number" min={0} required className={inputClasses} />
      </FormField>

      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : null}
        <ImageUploadButton
          pathPrefix={`new/${uploadId}`}
          label={imageUrl ? "Changer la photo" : "Ajouter une photo"}
          onUploaded={setImageUrl}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="isDailySpecial" className="accent-gold" />
        Suggestion du moment
      </label>
      <SubmitButton label="Ajouter le produit" pendingLabel="Ajout..." className="w-full" />
      <Result state={state} />
    </form>
  );
}
