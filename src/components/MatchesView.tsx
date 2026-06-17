"use client";

import { useMemo, useState } from "react";
import type { ApiMatch } from "@/lib/types";
import { toSpanishName } from "@/lib/teamMapping";
import {
  fmtDayKey,
  fmtTime,
  isFinished,
  isLive,
  isUpcoming,
  stageShort,
} from "@/lib/display";
import Crest from "./Crest";

type Filter = "todos" | "jugados" | "envivo" | "proximos";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "jugados", label: "Jugados" },
  { id: "envivo", label: "En vivo" },
  { id: "proximos", label: "Próximos" },
];

export default function MatchesView({ matches }: { matches: ApiMatch[] }) {
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered = useMemo(() => {
    const list = [...matches].sort(
      (a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)
    );
    if (filter === "jugados") return list.filter(isFinished);
    if (filter === "envivo") return list.filter(isLive);
    if (filter === "proximos") return list.filter(isUpcoming);
    return list;
  }, [matches, filter]);

  // Agrupar por día
  const byDay = useMemo(() => {
    const map = new Map<string, ApiMatch[]>();
    for (const m of filtered) {
      const key = fmtDayKey(m.utcDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="animate-slide-in">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f.id
                ? "bg-[#C8A84B] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {byDay.length === 0 && (
        <p className="text-center text-white/40 py-10">No hay partidos en esta categoría.</p>
      )}

      <div className="space-y-6">
        {byDay.map(([day, dayMatches]) => (
          <div key={day}>
            <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2 px-1 capitalize">
              {day}
            </h4>
            <div className="space-y-2">
              {dayMatches.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchRow({ m }: { m: ApiMatch }) {
  const live = isLive(m);
  const done = isFinished(m);
  const homeName = toSpanishName(m.home);
  const awayName = toSpanishName(m.away);
  const homeWon = m.winner === "HOME_TEAM";
  const awayWon = m.winner === "AWAY_TEAM";

  return (
    <div className="glass-card border px-3 py-2.5 flex items-center gap-2">
      {/* Etapa / hora */}
      <div className="w-14 flex-shrink-0 text-center">
        <div className="text-[10px] uppercase text-white/30 leading-tight">
          {stageShort(m.stage)}
        </div>
        {live ? (
          <span className="text-[10px] font-bold text-red-400 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            VIVO
          </span>
        ) : (
          <div className="text-xs text-white/50 tabular-nums">{fmtTime(m.utcDate)}</div>
        )}
      </div>

      {/* Local */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span
          className={`truncate text-sm ${homeWon ? "font-bold text-white" : "text-white/70"}`}
        >
          {homeName}
        </span>
        <Crest src={m.homeCrest} size={20} />
      </div>

      {/* Marcador */}
      <div className="flex-shrink-0 w-14 text-center">
        {done || live ? (
          <span
            className={`font-bold tabular-nums ${live ? "text-red-400" : "text-white"}`}
          >
            {m.homeGoals}<span className="text-white/30 mx-0.5">-</span>{m.awayGoals}
          </span>
        ) : (
          <span className="text-white/30 text-sm">vs</span>
        )}
      </div>

      {/* Visitante */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Crest src={m.awayCrest} size={20} />
        <span
          className={`truncate text-sm ${awayWon ? "font-bold text-white" : "text-white/70"}`}
        >
          {awayName}
        </span>
      </div>
    </div>
  );
}
