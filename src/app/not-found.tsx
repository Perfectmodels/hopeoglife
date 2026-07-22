import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.4em] text-gold">Erreur 404</p>
      <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
        Cette page n&apos;existe pas
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted">
        La page que vous recherchez a peut-être été déplacée ou n&apos;existe plus.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-soft"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
