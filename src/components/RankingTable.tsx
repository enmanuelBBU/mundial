"use client";

import { useState } from "react";
import type { ParticipantResult } from "@/app/api/standings/route";
import TeamBadge from "./TeamBadge";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_CLASSES = ["rank-1", "rank-2", "rank-3"];

interface Props {
  standings: ParticipantResult[];
  updatedAt: string;
  isDemo: boolean;
}

export default function RankingTable({ standings, updatedAt, isDemo }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const fmt = new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="max-w-3xl mx-auto px-4 pb-16">
      {isDemo && (
        <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300 text-center">
          ⚠️ Modo demo — datos simulados. Agrega tu API key en{" "}
          <code className="font-mono text-yellow-200">.env.local</code> para resultados reales.
        </div>
      )}

      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-heading text-2xl text-white/80 tracking-wider">TABLA DE POSICIONES</h3>
        <p className="text-xs text-white/30">
          Actualizado: {fmt.format(new Date(updatedAt))}
        </p>
      </div>

      <div className="space-y-3">
        {standings.map((p, i) => {
          const isTop = i < 3;
          const isOpen = expanded === p.name;

          return (
            <div
              key={p.name}
              className={`glass-card border animate-slide-in ${isTop ? RANK_CLASSES[i] : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Row principal */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpanded(isOpen ? null : p.name)}
              >
                {/* Posición */}
                <div className="w-9 text-center flex-shrink-0">
                  {isTop ? (
                    <span className="text-2xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="font-heading text-2xl text-white/40">{i + 1}</span>
                  )}
                </div>

                {/* Nombre */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base md:text-lg text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {p.teams.map((t) => t.name).join(" · ")}
                  </p>
                </div>

                {/* Puntos */}
                <div className="text-right flex-shrink-0">
                  <span className={`font-heading text-4xl ${isTop ? "text-[#C8A84B]" : "text-white/80"}`}>
                    {p.totalPoints}
                  </span>
                  <span className="text-xs text-white/40 ml-1">pts</span>
                </div>

                {/* Chevron */}
                <span className={`text-white/30 transition-transform text-sm ${isOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Detalle expandible */}
              {isOpen && (
                <div className="px-5 pb-4 grid gap-2 sm:grid-cols-3 border-t border-white/8 pt-3">
                  {p.teams.map((t) => (
                    <TeamBadge key={t.name} {...t} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/30">
        <span>🟢 Ganar = 3 puntos</span>
        <span>🟡 Empatar = 1 punto</span>
        <span>🔴 Perder = 0 puntos</span>
      </div>
    </section>
  );
}
