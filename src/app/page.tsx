import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import participants from "@/data/participants.json";
import {
  getAllMatches,
  getGroupTables,
  computeFamilyStandings,
  isDemoMode,
} from "@/lib/football";
import { toSpanishName } from "@/lib/teamMapping";
import { isBettingConfigured } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/session";
import { settlePendingBets, getUserBets, getMoneyRanking, getAllMatchBets, getAllUserTeams, getUserList } from "@/lib/bets";
import type { Bet, MatchBetEntry, MoneyRankEntry, Prediction, SessionUser, UserListEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const jsonData = participants as Record<string, string[]>;

  const [matches, groups] = await Promise.all([getAllMatches(), getGroupTables()]);

  // Lista de todos los equipos del torneo en español (para el selector de nuevos participantes).
  const allTeams = [...new Set(
    matches
      .filter((m) => m.home && m.away)
      .flatMap((m) => [toSpanishName(m.home!), toSpanishName(m.away!)])
  )].sort();

  // Combinar participants.json (originales) con selecciones guardadas en DB.
  // Los del JSON se cargan primero; los de DB se fusionan sin sobreescribir.
  let data: Record<string, string[]> = { ...jsonData };
  const familyTeams = [...new Set(Object.values(jsonData).flat())];
  const familyNames = Object.keys(jsonData);

  // ── Apuestas (solo si Supabase está configurado) ──
  let bettingConfigured = isBettingConfigured();
  let currentUser: SessionUser | null = null;
  let userBets: Bet[] = [];
  let moneyRanking: MoneyRankEntry[] = [];
  let allMatchBets: MatchBetEntry[] = [];
  let userList: UserListEntry[] = [];

  if (bettingConfigured) {
    try {
      // Liquidar apuestas de partidos ya terminados
      const results = new Map<number, Prediction>();
      for (const m of matches) {
        if (m.status === "FINISHED") {
          let winner = m.winner;
          if (
            m.duration === "PENALTY_SHOOTOUT" &&
            m.penaltiesHome !== undefined &&
            m.penaltiesHome !== null &&
            m.penaltiesAway !== undefined &&
            m.penaltiesAway !== null
          ) {
            if (m.penaltiesHome > m.penaltiesAway) {
              winner = "HOME_TEAM";
            } else if (m.penaltiesAway > m.penaltiesHome) {
              winner = "AWAY_TEAM";
            }
          }
          if (winner) {
            results.set(
              m.id,
              winner === "HOME_TEAM" ? "HOME" : winner === "AWAY_TEAM" ? "AWAY" : "DRAW"
            );
          }
        }
      }
      await settlePendingBets(results);

      // Fusionar selecciones de la DB con las del JSON (sin sobreescribir originales).
      const dbTeams = await getAllUserTeams();
      for (const [name, teams] of Object.entries(dbTeams)) {
        if (!data[name]) data[name] = teams; // solo agrega si no está en JSON
      }

      currentUser = await getCurrentUser();
      if (currentUser) userBets = await getUserBets(currentUser.id);
      [moneyRanking, allMatchBets, userList] = await Promise.all([
        getMoneyRanking(),
        getAllMatchBets(),
        getUserList(),
      ]);
    } catch (e) {
      // Si algo falla con la base de datos, el resto de la app sigue funcionando.
      console.error("Error en módulo de apuestas:", e);
      bettingConfigured = false;
    }
  }

  const standings = computeFamilyStandings(matches, data);
  const mergedFamilyNames = Object.keys(data);

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
        allMatchBets={allMatchBets}
        familyNames={mergedFamilyNames}
        allTeams={allTeams}
        userList={userList}
      />
    </main>
  );
}
