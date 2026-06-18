"use server";

import { revalidatePath } from "next/cache";
import { getAllMatches } from "./football";
import { isBettingConfigured } from "./supabase";
import {
  getCurrentUser,
  hashPin,
  verifyPin,
  setSessionCookie,
  clearSessionCookie,
} from "./session";
import { createUser, getUserRawByName, placeBet, saveUserTeams } from "./bets";
import type { ActionResult, Prediction } from "./types";

const PIN_RE = /^\d{4}$/;

// Entra o se registra: si el nombre existe verifica el PIN; si no, crea la cuenta.
// teams: selecciones de equipos para nuevos participantes (ignorado en login).
export async function loginAction(
  name: string,
  pin: string,
  teams: string[] = []
): Promise<ActionResult> {
  if (!isBettingConfigured())
    return { ok: false, error: "Las apuestas aún no están configuradas." };

  name = (name || "").trim();
  if (!name) return { ok: false, error: "Elige tu nombre." };
  if (!PIN_RE.test(pin)) return { ok: false, error: "El PIN debe ser de 4 dígitos." };

  const existing = await getUserRawByName(name);
  if (existing) {
    if (!verifyPin(pin, existing.pin_hash)) return { ok: false, error: "PIN incorrecto." };
    await setSessionCookie(existing.id);
  } else {
    const user = await createUser(name, hashPin(pin));
    if (!user) return { ok: false, error: "No se pudo crear la cuenta." };
    // Guardar selecciones de equipos si se proporcionaron (máx. 3, sin duplicados).
    const uniqueTeams = [...new Set(teams.filter(Boolean))].slice(0, 3);
    if (uniqueTeams.length > 0) await saveUserTeams(user.id, uniqueTeams);
    await setSessionCookie(user.id);
  }
  revalidatePath("/");
  return { ok: true };
}

export async function logoutAction(): Promise<ActionResult> {
  await clearSessionCookie();
  revalidatePath("/");
  return { ok: true };
}

export async function placeBetAction(
  matchId: number,
  prediction: Prediction,
  amount: number
): Promise<ActionResult> {
  if (!isBettingConfigured())
    return { ok: false, error: "Las apuestas no están configuradas." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión para apostar." };

  if (!["HOME", "DRAW", "AWAY"].includes(prediction))
    return { ok: false, error: "Predicción inválida." };
  amount = Math.floor(Number(amount));
  if (!Number.isFinite(amount) || amount < 1) return { ok: false, error: "Monto inválido." };

  const matches = await getAllMatches();
  const match = matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, error: "Partido no encontrado." };
  if (["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status))
    return { ok: false, error: "Ese partido ya empezó." };
  if (new Date(match.utcDate).getTime() <= Date.now())
    return { ok: false, error: "Ese partido ya empezó." };
  if (!match.home || !match.away)
    return { ok: false, error: "Aún no se conocen los equipos de ese partido." };

  const res = await placeBet(user.id, matchId, prediction, amount);
  if (res.ok) revalidatePath("/");
  return res;
}
