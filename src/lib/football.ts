import { toApiName } from "./teamMapping";

// football-data.org — código de la Copa del Mundo 2026
const WC_ID = 2000; // ID de la FIFA World Cup en football-data.org
const BASE_URL = "https://api.football-data.org/v4";

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number; // 3 × wins + 1 × draws
}

// Obtiene estadísticas de todos los partidos jugados en el torneo para un equipo
async function fetchMatchesForTeam(teamName: string): Promise<TeamStats> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey || apiKey === "TU_API_KEY_AQUI") {
    // Modo demo: devuelve datos simulados para que la UI sea visible sin API key
    return getMockStats(teamName);
  }

  const url = `${BASE_URL}/competitions/${WC_ID}/matches?status=FINISHED`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 300 }, // cache 5 minutos
  });

  if (!res.ok) {
    console.error(`Football API error: ${res.status}`);
    return getMockStats(teamName);
  }

  const data = await res.json();
  const matches = data.matches ?? [];

  let wins = 0, draws = 0, losses = 0, played = 0;
  const apiTeamName = toApiName(teamName);

  for (const match of matches) {
    const home = match.homeTeam?.name ?? "";
    const away = match.awayTeam?.name ?? "";
    if (home !== apiTeamName && away !== apiTeamName) continue;

    const homeGoals = match.score?.fullTime?.home ?? 0;
    const awayGoals = match.score?.fullTime?.away ?? 0;
    const isHome = home === apiTeamName;

    played++;
    if (homeGoals === awayGoals) {
      draws++;
    } else if ((isHome && homeGoals > awayGoals) || (!isHome && awayGoals > homeGoals)) {
      wins++;
    } else {
      losses++;
    }
  }

  return { played, wins, draws, losses, points: wins * 3 + draws };
}

// Caché en memoria (vive mientras el proceso Next.js está activo)
const statsCache: Map<string, { data: TeamStats; ts: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getTeamStats(spanishName: string): Promise<TeamStats> {
  const cached = statsCache.get(spanishName);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const stats = await fetchMatchesForTeam(spanishName);
  statsCache.set(spanishName, { data: stats, ts: Date.now() });
  return stats;
}

// ─── Datos simulados para modo demo ────────────────────────────────────────
const MOCK: Record<string, TeamStats> = {
  "Argentina":      { played: 3, wins: 3, draws: 0, losses: 0, points: 9 },
  "Francia":        { played: 3, wins: 2, draws: 1, losses: 0, points: 7 },
  "España":         { played: 3, wins: 2, draws: 1, losses: 0, points: 7 },
  "Portugal":       { played: 3, wins: 2, draws: 0, losses: 1, points: 6 },
  "Alemania":       { played: 3, wins: 1, draws: 2, losses: 0, points: 5 },
  "Colombia":       { played: 3, wins: 1, draws: 1, losses: 1, points: 4 },
  "Países Bajos":   { played: 3, wins: 1, draws: 1, losses: 1, points: 4 },
  "Inglaterra":     { played: 3, wins: 1, draws: 0, losses: 2, points: 3 },
  "México":         { played: 3, wins: 1, draws: 0, losses: 2, points: 3 },
  "Corea del Sur":  { played: 3, wins: 0, draws: 2, losses: 1, points: 2 },
  "Corea":          { played: 3, wins: 0, draws: 2, losses: 1, points: 2 },
  "Japón":          { played: 3, wins: 0, draws: 1, losses: 2, points: 1 },
  "Austria":        { played: 3, wins: 0, draws: 1, losses: 2, points: 1 },
  "Senegal":        { played: 3, wins: 0, draws: 1, losses: 2, points: 1 },
  "Uzbekistán":     { played: 3, wins: 0, draws: 0, losses: 3, points: 0 },
};

function getMockStats(name: string): TeamStats {
  return MOCK[name] ?? { played: 0, wins: 0, draws: 0, losses: 0, points: 0 };
}
