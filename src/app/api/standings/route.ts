import { NextResponse } from "next/server";
import participants from "@/data/participants.json";
import { getTeamStats } from "@/lib/football";

export const revalidate = 300; // Next.js revalida esta ruta cada 5 minutos

export interface ParticipantResult {
  name: string;
  teams: {
    name: string;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    points: number;
  }[];
  totalPoints: number;
}

export async function GET() {
  const data = participants as Record<string, string[]>;

  // Recopila todos los equipos únicos para hacer las peticiones en paralelo
  const allTeams = [...new Set(Object.values(data).flat())];
  const statsMap = new Map(
    await Promise.all(allTeams.map(async (t) => [t, await getTeamStats(t)] as const))
  );

  const results: ParticipantResult[] = Object.entries(data).map(([name, teams]) => {
    const teamDetails = teams.map((teamName) => {
      const s = statsMap.get(teamName) ?? { played: 0, wins: 0, draws: 0, losses: 0, points: 0 };
      return { name: teamName, ...s };
    });
    const totalPoints = teamDetails.reduce((sum, t) => sum + t.points, 0);
    return { name, teams: teamDetails, totalPoints };
  });

  // Ordenar de mayor a menor puntaje; empate → orden alfabético
  results.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    isDemo: !process.env.FOOTBALL_API_KEY || process.env.FOOTBALL_API_KEY === "TU_API_KEY_AQUI",
    standings: results,
  });
}
