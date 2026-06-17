import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import participants from "@/data/participants.json";
import {
  getAllMatches,
  getGroupTables,
  computeFamilyStandings,
  isDemoMode,
} from "@/lib/football";

// Renderizado dinámico: datos frescos en cada petición (la caché vive en football.ts).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const data = participants as Record<string, string[]>;

  // Dos llamadas a la API (partidos + grupos), cacheadas 5 min y compartidas.
  const [matches, groups] = await Promise.all([getAllMatches(), getGroupTables()]);

  const standings = computeFamilyStandings(matches, data);
  const familyTeams = [...new Set(Object.values(data).flat())];

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
      />
    </main>
  );
}
