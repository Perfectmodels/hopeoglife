import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { galleryPlaceholders } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Découvrez en images l'univers de Hope Of Life : salle, bar, terrasse et événements.",
};

export default function GalleryPage() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Galerie"
          title="L'univers Hope Of Life"
          description="Photos à venir — cette galerie sera bientôt enrichie avec les visuels du lieu, des plats, des cocktails et de nos événements."
          align="center"
        />
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {galleryPlaceholders.map((item) => (
            <BrandedVisual key={item.id} label={item.label} className="aspect-[4/5]" />
          ))}
        </div>
      </Container>
    </section>
  );
}
