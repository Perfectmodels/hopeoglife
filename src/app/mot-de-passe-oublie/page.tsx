import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/dashboard/ForgotPasswordForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl font-semibold text-gradient-gold">
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-muted">Réinitialiser votre mot de passe</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/connexion" className="hover:text-gold">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
