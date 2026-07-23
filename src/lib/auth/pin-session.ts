import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { PIN_SESSION_COOKIE } from "./session-cookie";

export { PIN_SESSION_COOKIE };
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12h — la durée d'un service

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET n'est pas configuré dans .env.local");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export async function createPinSession(employeeId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${employeeId}.${expiresAt}`;
  const signature = sign(payload);
  const cookieStore = await cookies();

  cookieStore.set(PIN_SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function verifyPinSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PIN_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [employeeId, expiresAtRaw, signature] = parts;
  const payload = `${employeeId}.${expiresAtRaw}`;
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return employeeId;
}

export async function clearPinSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PIN_SESSION_COOKIE);
}
