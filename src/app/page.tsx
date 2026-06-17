import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import participants from "@/data/participants.json";
import {
  getAllMatches,
  getGroupTables,
  computeFamilyStandings,
  isDemoMode,
} from "@/lib/football";
import { isBettingConfigured } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/session";
import { settlePendingBets, getUserBets, getMoneyRanking } from "@/lib/bets";
import type { Bet, MoneyRankEntry, Prediction, SessionUser } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const data = participants as Record<string, string[]>;

  const [matches, groups] = await Promise.all([getAllMatches(), getGroupTables()]);
  const standings = computeFamilyStandings(matches, data);
  const familyTeams = [...new Set(Object.values(data).flat())];
  const familyNames = Object.keys(data);

  // ── Apuestas (solo si Supabase está configurado) ──
  let bettingConfigured = isBettingConfigured();
  let currentUser: SessionUser | null = null;
  let userBets: Bet[] = [];
  let moneyRanking: MoneyRankEntry[] = [];

  if (bettingConfigured) {
    try {
      // Liquidar apuestas de partidos ya terminados
      const results = new Map<number, Prediction>();
      for (const m of matches) {
        if (m.status === "FINISHED" && m.winner) {
          results.set(
            m.id,
            m.winner === "HOME_TEAM" ? "HOME" : m.winner === "AWAY_TEAM" ? "AWAY" : "DRAW"
          );
        }
      }
      await settlePendingBets(results);

      currentUser = await getCurrentUser();
      if (currentUser) userBets = await getUserBets(currentUser.id);
      moneyRanking = await getMoneyRanking();
    } catch (e) {
      // Si algo falla con la base de datos, el resto de la app sigue funcionando.
      console.error("Error en módulo de apuestas:", e);
      bettingConfigured = false;
    }
  }

  return (
    <main>
      <Header />
      <Dashboard
        standings={standings}
        matches={matches}
        groups={groups}
        familyTeams={familyTeams}
        updatedAt={new Date().toISOString()}
        isDemo={isDemoMode()}
        bettingConfigured={bettingConfigured}
        currentUser={currentUser}
        userBets={userBets}
        moneyRanking={moneyRanking}
        familyNames={familyNames}
      />
    </main>
  );
}
