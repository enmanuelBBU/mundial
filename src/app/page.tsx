import Header from "@/components/Header";
import RankingTable from "@/components/RankingTable";
import RefreshButton from "@/components/RefreshButton";
import participants from "@/data/participants.json";
import { getTeamStats } from "@/lib/football";
import type { ParticipantResult } from "./api/standings/route";

// Renderizado dinámico: siempre obtiene datos frescos en cada petición
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getStandings(): Promise<{
  standings: ParticipantResult[];
  updatedAt: string;
  isDemo: boolean;
}> {
  const data = participants as Record<string, string[]>;
  const allTeams = [...new Set(Object.values(data).flat())];

  const statsMap = new Map(
    await Promise.all(allTeams.map(async (t) => [t, await getTeamStats(t)] as const))
  );

  const standings: ParticipantResult[] = Object.entries(data).map(([name, teams]) => {
    const teamDetails = teams.map((teamName) => {
      const s = statsMap.get(teamName) ?? { played: 0, wins: 0, draws: 0, losses: 0, points: 0 };
      return { name: teamName, ...s };
    });
    const totalPoints = teamDetails.reduce((sum, t) => sum + t.points, 0);
    return { name, teams: teamDetails, totalPoints };
  });

  standings.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));

  const isDemo =
    !process.env.FOOTBALL_API_KEY || process.env.FOOTBALL_API_KEY === "TU_API_KEY_AQUI";

  return { standings, updatedAt: new Date().toISOString(), isDemo };
}

export default async function HomePage() {
  const { standings, updatedAt, isDemo } = await getStandings();

  return (
    <main>
      <Header />
      <RefreshButton />
      <RankingTable standings={standings} updatedAt={updatedAt} isDemo={isDemo} />
    </main>
  );
}
