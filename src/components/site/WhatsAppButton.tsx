import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function WhatsAppButton() {
  const phoneDigits = siteConfig.whatsapp.replace(/[^\d]/g, "");

  return (
    <a
      href={`https://wa.me/${phoneDigits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactez-nous sur WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-background shadow-lg shadow-black/40 transition-transform hover:scale-105"
    >
      <MessageCircle size={26} />
    </a>
  );
}
