// Helpers de presentación puros (sin código de servidor → seguros en cliente).
import type { ApiMatch } from "./types";

export const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  LAST_32: "Dieciseisavos",
  LAST_16: "Octavos de Final",
  QUARTER_FINALS: "Cuartos de Final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer Puesto",
  FINAL: "Final",
};

export const STAGE_SHORT: Record<string, string> = {
  GROUP_STAGE: "Grupos",
  LAST_32: "16avos",
  LAST_16: "8vos",
  QUARTER_FINALS: "4tos",
  SEMI_FINALS: "Semi",
  THIRD_PLACE: "3°",
  FINAL: "Final",
};

// Orden de las rondas eliminatorias (para brackets y "camino a la final").
export const KNOCKOUT_ORDER = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
] as const;

export const stageLabel = (s: string) => STAGE_LABELS[s] ?? s;
export const stageShort = (s: string) => STAGE_SHORT[s] ?? s;

export const isFinished = (m: ApiMatch) => m.status === "FINISHED";
export const isLive = (m: ApiMatch) => m.status === "IN_PLAY" || m.status === "PAUSED";
export const isUpcoming = (m: ApiMatch) => !isFinished(m) && !isLive(m);

// Resultado del partido desde la perspectiva de un equipo (nombre de la API).
export function matchResultFor(
  m: ApiMatch,
  apiTeamName: string
): "win" | "loss" | "draw" | null {
  if (!isFinished(m)) return null;
  const isHome = m.home === apiTeamName;
  const isAway = m.away === apiTeamName;
  if (!isHome && !isAway) return null;

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

  if (winner === "DRAW") return "draw";
  if ((winner === "HOME_TEAM" && isHome) || (winner === "AWAY_TEAM" && isAway))
    return "win";
  return "loss";
}

const DATE = new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short" });
const TIME = new Intl.DateTimeFormat("es-VE", { hour: "2-digit", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export const fmtDate = (iso: string) => DATE.format(new Date(iso));
export const fmtTime = (iso: string) => TIME.format(new Date(iso));
export const fmtDayKey = (iso: string) => DAY.format(new Date(iso));
export const groupLabel = (g: string) => g.replace("Group", "Grupo");
