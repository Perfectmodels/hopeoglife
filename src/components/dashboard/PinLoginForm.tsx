"use client";

import { useState, useTransition } from "react";
import { PinPad } from "./PinPad";
import { loginWithPin } from "@/lib/actions/auth";

export function PinLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePin(pin: string) {
    setError(null);
    const formData = new FormData();
    formData.set("pin", pin);
    startTransition(async () => {
      const result = await loginWithPin(null, formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <PinPad onSubmit={handlePin} submitting={isPending} error={error} />
    </div>
  );
}
