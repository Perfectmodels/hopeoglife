"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  imageUrl?: string;
  caption?: string;
};

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== index}
        >
          {slide.imageUrl ? (
            <Image
              src={slide.imageUrl}
              alt={slide.caption ?? ""}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 0%, rgba(201,162,74,0.18), transparent 60%), linear-gradient(180deg, #0b0a08 0%, #131110 60%, #0b0a08 100%)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
        </div>
      ))}

      {slides.length > 1 ? (
        <>
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Aller à l'image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-muted/50 hover:bg-muted"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Image précédente"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-background/60 p-2 text-champagne backdrop-blur transition-colors hover:border-gold hover:text-gold sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Image suivante"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-background/60 p-2 text-champagne backdrop-blur transition-colors hover:border-gold hover:text-gold sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        </>
      ) : null}
    </div>
  );
}
