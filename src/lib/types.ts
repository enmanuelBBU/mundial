// Tipos del dominio. Este archivo NO importa código de servidor, así que es
// seguro importarlo desde componentes cliente (los tipos se borran al compilar).

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: string; // FINISHED | IN_PLAY | PAUSED | TIMED | SCHEDULED
  stage: string; // GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | SEMI_FINALS | THIRD_PLACE | FINAL
  group: string | null; // "Group A" … o null en eliminatorias
  matchday: number | null;
  home: string | null; // nombre del equipo (null = por definir)
  homeTla: string | null;
  homeCrest: string | null;
  away: string | null;
  awayTla: string | null;
  awayCrest: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string | null; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
}

export interface GroupRow {
  position: number;
  team: string;
  crest: string | null;
  tla: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalDifference: number;
}

export interface GroupTable {
  group: string; // "Group A"
  rows: GroupRow[];
}

export interface ParticipantTeam extends TeamStats {
  name: string;
}

export interface ParticipantResult {
  name: string;
  teams: ParticipantTeam[];
  totalPoints: number;
}

// ─── Apuestas con dinero ficticio ───────────────────────────────────────────
export type Prediction = "HOME" | "DRAW" | "AWAY";
export type BetStatus = "PENDING" | "WON" | "LOST";

export interface SessionUser {
  id: string;
  name: string;
  balance: number;
}

export interface Bet {
  id: string;
  matchId: number;
  prediction: Prediction;
  amount: number;
  status: BetStatus;
  payout: number;
  createdAt: string;
}

export interface MoneyRankEntry {
  name: string;
  balance: number;
}

export interface MatchBetEntry {
  matchId: number;
  userName: string;
  prediction: Prediction;
  amount: number;
  status: BetStatus;
}

export interface UserListEntry {
  id: string;
  name: string;
  balance: number;
}

// Resultado estándar de las acciones de servidor (login, apostar…).
export interface ActionResult {
  ok: boolean;
  error?: string;
}
