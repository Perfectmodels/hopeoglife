import type { Metadata } from "next";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Espace personnel Hope Of Life.",
};

export default function ConnexionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl font-semibold text-gradient-gold">
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-muted">Espace personnel</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
