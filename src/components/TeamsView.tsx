"use client";

import { useMemo } from "react";
import type { ApiMatch } from "@/lib/types";
import { toApiName } from "@/lib/teamMapping";
import { KNOCKOUT_ORDER, isLive, matchResultFor } from "@/lib/display";
import Crest from "./Crest";

// Estado de cada casilla del recorrido de un equipo.
type SlotState = "win" | "loss" | "draw" | "live" | "scheduled" | "pending";

const SLOT_STYLE: Record<SlotState, string> = {
  win: "bg-green-500 border-green-400",
  loss: "bg-red-500 border-red-400",
  draw: "bg-amber-400 border-amber-300",
  live: "bg-red-500 border-red-300 animate-pulse",
  scheduled: "bg-sky-500/70 border-sky-400",
  pending: "bg-white/5 border-white/15",
};

const KO_LABELS: Record<string, string> = {
  LAST_32: "16°",
  LAST_16: "8°",
  QUARTER_FINALS: "4°",
  SEMI_FINALS: "SF",
  FINAL: "🏆",
};

function slotFromMatch(m: ApiMatch | undefined, apiName: string): SlotState {
  if (!m) return "pending";
  if (isLive(m)) return "live";
  const r = matchResultFor(m, apiName);
  if (r) return r;
  return "scheduled"; // existe el partido y el equipo está, pero aún no se juega
}

export default function TeamsView({
  matches,
  familyTeams,
}: {
  matches: ApiMatch[];
  familyTeams: string[];
}) {
  const teams = [...familyTeams].sort((a, b) => a.localeCompare(b));

  // Escudo oficial por equipo (tomado de cualquier partido donde aparezca).
  const crestByTeam = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      if (m.home && m.homeCrest && !map.has(m.home)) map.set(m.home, m.homeCrest);
      if (m.away && m.awayCrest && !map.has(m.away)) map.set(m.away, m.awayCrest);
    }
    return map;
  }, [matches]);

  return (
    <div className="animate-slide-in">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-xs text-white/50">
        <Legend color="bg-green-500" label="Ganó" />
        <Legend color="bg-red-500" label="Perdió" />
        <Legend color="bg-amber-400" label="Empató" />
        <Legend color="bg-sky-500/70" label="Clasificado" />
        <Legend color="bg-white/10" label="Por jugar" />
      </div>

      <div className="space-y-2.5">
        {teams.map((team) => {
          const apiName = toApiName(team);
          const teamMatches = matches
            .filter((m) => m.home === apiName || m.away === apiName)
            .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));

          // Récord (todas sus finalizadas)
          let w = 0,
            d = 0,
            l = 0;
          for (const m of teamMatches) {
            const r = matchResultFor(m, apiName);
            if (r === "win") w++;
            else if (r === "draw") d++;
            else if (r === "loss") l++;
          }
          const points = w * 3 + d;

          // 3 casillas de grupo (sin jugar = gris) + 5 de eliminatoria
          const groupMatches = teamMatches.filter((m) => m.stage === "GROUP_STAGE");
          const groupSlots = [0, 1, 2].map((i) => {
            const s = slotFromMatch(groupMatches[i], apiName);
            return { label: `F${i + 1}`, state: s === "scheduled" ? "pending" : s };
          });
          const koSlots = KNOCKOUT_ORDER.map((stage) => ({
            label: KO_LABELS[stage],
            state: slotFromMatch(
              teamMatches.find((m) => m.stage === stage),
              apiName
            ),
          }));
          const slots: { label: string; state: SlotState }[] = [...groupSlots, ...koSlots];

          return (
            <div
              key={team}
              className="glass-card border px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap"
            >
              {/* Equipo */}
              <div className="flex items-center gap-2 w-40 flex-shrink-0">
                <Crest src={crestByTeam.get(apiName) ?? null} size={26} />
                <span className="font-semibold text-white truncate">{team}</span>
              </div>

              {/* Recorrido */}
              <div className="flex items-end gap-1.5 flex-1">
                {slots.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span
                      className={`w-6 h-6 rounded-full border ${SLOT_STYLE[s.state]}`}
                      title={s.label}
                    />
                    <span className="text-[9px] text-white/30 leading-none">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Puntos */}
              <div className="text-right flex-shrink-0 w-16">
                <div className="font-heading text-2xl text-[#C8A84B] leading-none">{points}</div>
                <div className="text-[10px] text-white/40">
                  {w}G {d}E {l}P
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}
