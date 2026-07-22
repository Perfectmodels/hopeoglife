"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0b0a08",
          color: "#f4efe4",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Une erreur est survenue</h1>
        <p style={{ color: "#a89f8f" }}>Merci de réessayer dans quelques instants.</p>
        <button
          onClick={() => reset()}
          style={{
            borderRadius: "9999px",
            padding: "0.75rem 1.5rem",
            background: "#c9a24a",
            color: "#0b0a08",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
