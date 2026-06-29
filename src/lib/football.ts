import { toApiName } from "./teamMapping";
import type {
  ApiMatch,
  GroupTable,
  TeamStats,
  ParticipantResult,
} from "./types";

const WC_ID = 2000; // FIFA World Cup en football-data.org
const BASE_URL = "https://api.football-data.org/v4";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function isDemoMode(): boolean {
  const k = process.env.FOOTBALL_API_KEY;
  return !k || k === "TU_API_KEY_AQUI";
}

async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY as string },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Football API ${res.status} en ${path}`);
  return res.json();
}

// ─── Caché en memoria (proceso de Next.js) ──────────────────────────────────
let matchesCache: { data: ApiMatch[]; ts: number } | null = null;
let groupsCache: { data: GroupTable[]; ts: number } | null = null;

// Todos los partidos del torneo (jugados, en vivo y por jugar) en UNA sola llamada.
export async function getAllMatches(): Promise<ApiMatch[]> {
  if (isDemoMode()) return MOCK_MATCHES;
  if (matchesCache && Date.now() - matchesCache.ts < CACHE_TTL) return matchesCache.data;
  try {
    const data = await apiGet(`/competitions/${WC_ID}/matches`);
    const matches: ApiMatch[] = (data.matches ?? []).map((m: any) => ({
      id: m.id,
      utcDate: m.utcDate,
      status: m.status,
      stage: m.stage,
      group: m.group ?? null,
      matchday: m.matchday ?? null,
      home: m.homeTeam?.name ?? null,
      homeTla: m.homeTeam?.tla ?? null,
      homeCrest: m.homeTeam?.crest ?? null,
      away: m.awayTeam?.name ?? null,
      awayTla: m.awayTeam?.tla ?? null,
      awayCrest: m.awayTeam?.crest ?? null,
      homeGoals: m.score?.fullTime?.home ?? null,
      awayGoals: m.score?.fullTime?.away ?? null,
      winner: m.score?.winner ?? null,
      duration: m.score?.duration ?? null,
    }));
    matchesCache = { data: matches, ts: Date.now() };
    return matches;
  } catch (e) {
    console.error(e);
    return matchesCache?.data ?? MOCK_MATCHES;
  }
}

// Tablas oficiales de los 12 grupos (con puntos) en UNA sola llamada.
export async function getGroupTables(): Promise<GroupTable[]> {
  if (isDemoMode()) return MOCK_GROUPS;
  if (groupsCache && Date.now() - groupsCache.ts < CACHE_TTL) return groupsCache.data;
  try {
    const data = await apiGet(`/competitions/${WC_ID}/standings`);
    const groups: GroupTable[] = (data.standings ?? [])
      .filter((s: any) => s.type === "TOTAL" && s.group)
      .map((s: any) => ({
        group: s.group,
        rows: (s.table ?? []).map((r: any) => ({
          position: r.position,
          team: r.team?.name ?? "?",
          crest: r.team?.crest ?? null,
          tla: r.team?.tla ?? null,
          played: r.playedGames,
          won: r.won,
          draw: r.draw,
          lost: r.lost,
          points: r.points,
          goalDifference: r.goalDifference,
        })),
      }));
    groupsCache = { data: groups, ts: Date.now() };
    return groups;
  } catch (e) {
    console.error(e);
    return groupsCache?.data ?? MOCK_GROUPS;
  }
}

// ─── Puntos por victoria según fase ─────────────────────────────────────────
// Grupos: 3 pts · 16avos: 4 pts · 8vos: 6 pts · Cuartos: 8 pts
// Semifinales: 10 pts · Final: 12 pts
const WIN_POINTS: Record<string, number> = {
  GROUP_STAGE: 3,
  LAST_32: 4,   // 16avos de final
  LAST_16: 6,   // 8vos de final
  QUARTER_FINALS: 8,
  SEMI_FINALS: 10,
  THIRD_PLACE: 8, // mismo valor que cuartos
  FINAL: 12,
};

// ─── Cálculo de puntos (función pura) ───────────────────────────────────────
// Usa el campo `winner` de la API, así un triunfo por penales en eliminatorias
// cuenta como victoria. En fase de grupos winner = HOME/AWAY/DRAW.
// Los puntos por victoria escalan con la fase del torneo.
export function computeTeamStats(matches: ApiMatch[], apiTeamName: string): TeamStats {
  let wins = 0,
    draws = 0,
    losses = 0,
    played = 0,
    points = 0;
  for (const m of matches) {
    if (m.status !== "FINISHED") continue;
    const isHome = m.home === apiTeamName;
    const isAway = m.away === apiTeamName;
    if (!isHome && !isAway) continue;
    played++;
    const winPts = WIN_POINTS[m.stage] ?? 3;
    if (m.winner === "DRAW") {
      draws++;
      points += 1;
    } else if ((m.winner === "HOME_TEAM" && isHome) || (m.winner === "AWAY_TEAM" && isAway)) {
      wins++;
      points += winPts;
    } else {
      losses++;
    }
  }
  return { played, wins, draws, losses, points };
}

export function computeFamilyStandings(
  matches: ApiMatch[],
  participants: Record<string, string[]>
): ParticipantResult[] {
  const res: ParticipantResult[] = Object.entries(participants).map(([name, teams]) => {
    const teamDetails = teams.map((t) => ({
      name: t,
      ...computeTeamStats(matches, toApiName(t)),
    }));
    const totalPoints = teamDetails.reduce((s, t) => s + t.points, 0);
    return { name, teams: teamDetails, totalPoints };
  });
  res.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  return res;
}

// ─── Datos simulados (modo demo, sin API key) ───────────────────────────────
function fin(
  id: number,
  stage: string,
  group: string | null,
  matchday: number | null,
  date: string,
  h: string,
  a: string,
  hg: number,
  ag: number
): ApiMatch {
  const winner = hg > ag ? "HOME_TEAM" : hg < ag ? "AWAY_TEAM" : "DRAW";
  return {
    id,
    utcDate: date,
    status: "FINISHED",
    stage,
    group,
    matchday,
    home: h,
    homeTla: null,
    homeCrest: null,
    away: a,
    awayTla: null,
    awayCrest: null,
    homeGoals: hg,
    awayGoals: ag,
    winner,
    duration: "REGULAR",
  };
}
function sched(
  id: number,
  stage: string,
  group: string | null,
  date: string,
  h: string | null,
  a: string | null
): ApiMatch {
  return {
    id,
    utcDate: date,
    status: "TIMED",
    stage,
    group,
    matchday: null,
    home: h,
    homeTla: null,
    homeCrest: null,
    away: a,
    awayTla: null,
    awayCrest: null,
    homeGoals: null,
    awayGoals: null,
    winner: null,
    duration: null,
  };
}

const MOCK_MATCHES: ApiMatch[] = [
  fin(1, "GROUP_STAGE", "Group A", 1, "2026-06-11T18:00:00Z", "Argentina", "Senegal", 2, 0),
  fin(2, "GROUP_STAGE", "Group A", 2, "2026-06-15T18:00:00Z", "Argentina", "Japan", 3, 1),
  fin(3, "GROUP_STAGE", "Group A", 3, "2026-06-19T18:00:00Z", "Austria", "Argentina", 0, 2),
  fin(4, "GROUP_STAGE", "Group B", 1, "2026-06-12T18:00:00Z", "France", "Mexico", 2, 1),
  fin(5, "GROUP_STAGE", "Group B", 2, "2026-06-16T18:00:00Z", "France", "Uzbekistan", 1, 1),
  fin(6, "GROUP_STAGE", "Group B", 3, "2026-06-20T18:00:00Z", "France", "South Korea", 3, 0),
  fin(7, "GROUP_STAGE", "Group C", 1, "2026-06-12T21:00:00Z", "Spain", "Netherlands", 2, 0),
  fin(8, "GROUP_STAGE", "Group C", 2, "2026-06-16T21:00:00Z", "Spain", "Colombia", 1, 1),
  fin(9, "GROUP_STAGE", "Group C", 3, "2026-06-20T21:00:00Z", "England", "Spain", 1, 2),
  fin(10, "GROUP_STAGE", "Group D", 1, "2026-06-13T18:00:00Z", "Portugal", "Mexico", 1, 0),
  fin(11, "GROUP_STAGE", "Group D", 2, "2026-06-17T18:00:00Z", "Germany", "England", 1, 1),
  fin(12, "GROUP_STAGE", "Group D", 3, "2026-06-21T18:00:00Z", "Germany", "Japan", 2, 0),
  sched(13, "GROUP_STAGE", "Group C", "2026-06-25T18:00:00Z", "Netherlands", "Colombia"),
  sched(14, "GROUP_STAGE", "Group D", "2026-06-26T21:00:00Z", "Portugal", "Germany"),
  sched(15, "LAST_32", null, "2026-06-29T18:00:00Z", null, null),
  sched(16, "LAST_16", null, "2026-07-04T18:00:00Z", null, null),
  sched(17, "QUARTER_FINALS", null, "2026-07-09T18:00:00Z", null, null),
  sched(18, "SEMI_FINALS", null, "2026-07-14T18:00:00Z", null, null),
  sched(19, "FINAL", null, "2026-07-19T18:00:00Z", null, null),
];

function row(
  position: number,
  team: string,
  played: number,
  won: number,
  draw: number,
  lost: number
) {
  return {
    position,
    team,
    crest: null,
    tla: null,
    played,
    won,
    draw,
    lost,
    points: won * 3 + draw,
    goalDifference: won * 2 - lost,
  };
}

const MOCK_GROUPS: GroupTable[] = [
  {
    group: "Group A",
    rows: [
      row(1, "Argentina", 3, 3, 0, 0),
      row(2, "Senegal", 3, 1, 1, 1),
      row(3, "Japan", 3, 1, 0, 2),
      row(4, "Austria", 3, 0, 1, 2),
    ],
  },
  {
    group: "Group B",
    rows: [
      row(1, "France", 3, 2, 1, 0),
      row(2, "Mexico", 3, 1, 1, 1),
      row(3, "Uzbekistan", 3, 0, 2, 1),
      row(4, "South Korea", 3, 0, 2, 1),
    ],
  },
  {
    group: "Group C",
    rows: [
      row(1, "Spain", 3, 2, 1, 0),
      row(2, "Colombia", 3, 1, 1, 1),
      row(3, "Netherlands", 3, 1, 0, 2),
      row(4, "England", 3, 0, 1, 2),
    ],
  },
];
