import "server-only";
import { getSupabase } from "./supabase";
import type { Bet, BetStatus, MatchBetEntry, MoneyRankEntry, Prediction, SessionUser } from "./types";

export const START_BALANCE = 1000;

// ─── Usuarios ───────────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<SessionUser | null> {
  const { data } = await getSupabase()
    .from("users")
    .select("id,name,balance")
    .eq("id", id)
    .maybeSingle();
  return data ? { id: data.id, name: data.name, balance: data.balance } : null;
}

export async function getUserRawByName(
  name: string
): Promise<{ id: string; name: string; balance: number; pin_hash: string } | null> {
  const { data } = await getSupabase()
    .from("users")
    .select("id,name,balance,pin_hash")
    .eq("name", name)
    .maybeSingle();
  return data ?? null;
}

export async function createUser(name: string, pinHash: string): Promise<SessionUser | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .insert({ name, pin_hash: pinHash, balance: START_BALANCE })
    .select("id,name,balance")
    .single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, balance: data.balance };
}

// ─── Apuestas ───────────────────────────────────────────────────────────────
export async function placeBet(
  userId: string,
  matchId: number,
  prediction: Prediction,
  amount: number
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();

  const user = await getUserById(userId);
  if (!user) return { ok: false, error: "Usuario no encontrado." };
  if (amount > user.balance) return { ok: false, error: "Saldo insuficiente." };

  // Insertar la apuesta (la restricción única bloquea apostar 2 veces al partido)
  const { error: insErr } = await sb.from("bets").insert({
    user_id: userId,
    match_id: matchId,
    prediction,
    amount,
    status: "PENDING",
    payout: 0,
  });
  if (insErr) {
    if (insErr.code === "23505") return { ok: false, error: "Ya apostaste en este partido." };
    return { ok: false, error: "No se pudo registrar la apuesta." };
  }

  // Descontar el monto del saldo
  await sb.from("users").update({ balance: user.balance - amount }).eq("id", userId);
  return { ok: true };
}

export async function getUserBets(userId: string): Promise<Bet[]> {
  const { data } = await getSupabase()
    .from("bets")
    .select("id,match_id,prediction,amount,status,payout,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((b) => ({
    id: b.id,
    matchId: b.match_id,
    prediction: b.prediction as Prediction,
    amount: b.amount,
    status: b.status as BetStatus,
    payout: b.payout,
    createdAt: b.created_at,
  }));
}

// Liquida las apuestas PENDING cuyos partidos ya terminaron.
// results: matchId → resultado real ("HOME" | "DRAW" | "AWAY").
export async function settlePendingBets(results: Map<number, Prediction>) {
  const sb = getSupabase();
  const { data: pending } = await sb
    .from("bets")
    .select("id,user_id,match_id,prediction,amount,status")
    .eq("status", "PENDING");
  if (!pending || pending.length === 0) return;

  for (const bet of pending) {
    const actual = results.get(bet.match_id);
    if (!actual) continue; // el partido aún no termina

    const won = bet.prediction === actual;
    const payout = won ? bet.amount * 2 : 0;

    // Flip atómico: solo gana la "carrera" quien cambia el estado de PENDING.
    const { data: updated } = await sb
      .from("bets")
      .update({ status: won ? "WON" : "LOST", payout, resolved_at: new Date().toISOString() })
      .eq("id", bet.id)
      .eq("status", "PENDING")
      .select("id")
      .maybeSingle();

    if (updated && payout > 0) {
      const u = await getUserById(bet.user_id);
      if (u) await sb.from("users").update({ balance: u.balance + payout }).eq("id", bet.user_id);
    }
  }
}

export async function getAllMatchBets(): Promise<MatchBetEntry[]> {
  const { data } = await getSupabase()
    .from("bets")
    .select("match_id, prediction, amount, status, users(name)");
  return (data ?? []).map((b: any) => ({
    matchId: b.match_id,
    userName: (b.users as { name: string } | null)?.name ?? "?",
    prediction: b.prediction as Prediction,
    amount: b.amount,
    status: b.status as BetStatus,
  }));
}

export async function getMoneyRanking(): Promise<MoneyRankEntry[]> {
  const { data } = await getSupabase()
    .from("users")
    .select("name,balance")
    .order("balance", { ascending: false })
    .limit(50);
  return (data ?? []).map((u) => ({ name: u.name, balance: u.balance }));
}
