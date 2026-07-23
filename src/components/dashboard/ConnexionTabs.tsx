"use client";

import { useState } from "react";
import { PinLoginForm } from "./PinLoginForm";
import { LoginForm } from "./LoginForm";

export function ConnexionTabs() {
  const [mode, setMode] = useState<"pin" | "email">("pin");

  return (
    <div>
      {mode === "pin" ? (
        <>
          <p className="mb-6 text-center text-sm text-muted">Entrez votre code PIN</p>
          <PinLoginForm />
          <button
            type="button"
            onClick={() => setMode("email")}
            className="mt-8 block w-full text-center text-xs text-muted hover:text-gold"
          >
            Connexion back-office (e-mail)
          </button>
        </>
      ) : (
        <>
          <LoginForm />
          <button
            type="button"
            onClick={() => setMode("pin")}
            className="mt-6 block w-full text-center text-xs text-muted hover:text-gold"
          >
            ← Connexion par code PIN
          </button>
        </>
      )}
    </div>
  );
}
