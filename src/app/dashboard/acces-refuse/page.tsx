import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Accès refusé" };

export default function AccesRefusePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert size={40} className="text-red-400" />
      <h1 className="font-display text-2xl text-foreground">Accès refusé</h1>
      <p className="max-w-md text-sm text-muted">
        Votre rôle ne vous permet pas d&apos;accéder à cette section. Contactez un administrateur
        si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-background hover:bg-gold-soft"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
