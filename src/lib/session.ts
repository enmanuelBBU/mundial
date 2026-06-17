import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";
import { isBettingConfigured } from "./supabase";
import { getUserById } from "./bets";

const COOKIE = "mb_session";
const MAX_AGE = 30 * 24 * 3600; // 30 días
const SECRET = process.env.SESSION_SECRET || "";

// ─── PIN: hash con scrypt (sin dependencias externas) ───────────────────────
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pin, salt, 64);
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === test.length && crypto.timingSafeEqual(hashBuf, test);
}

// ─── Cookie de sesión firmada con HMAC ──────────────────────────────────────
const sign = (data: string) =>
  crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

function signSession(userId: string): string {
  const payload = `${userId}.${Date.now() + MAX_AGE * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function verifySession(token: string): string | null {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const payload = Buffer.from(b64, "base64url").toString();
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const [userId, expStr] = payload.split(".");
    if (!userId || Date.now() > Number(expStr)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const c = await cookies();
  c.set(COOKIE, signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

async function getSessionUserId(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  return t ? verifySession(t) : null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isBettingConfigured()) return null;
  const id = await getSessionUserId();
  if (!id) return null;
  return getUserById(id);
}
