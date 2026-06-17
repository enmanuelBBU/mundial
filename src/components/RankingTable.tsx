"use client";

import { useState } from "react";
import type { ParticipantResult } from "@/lib/types";
import TeamBadge from "./TeamBadge";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_CLASSES = ["rank-1", "rank-2", "rank-3"];

export default function RankingTable({ standings }: { standings: ParticipantResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="animate-slide-in">
      <div className="space-y-3">
        {standings.map((p, i) => {
          const isTop = i < 3;
          const isOpen = expanded === p.name;

          return (
            <div
              key={p.name}
              className={`glass-card border ${isTop ? RANK_CLASSES[i] : ""}`}
            >
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpanded(isOpen ? null : p.name)}
              >
                <div className="w-9 text-center flex-shrink-0">
                  {isTop ? (
                    <span className="text-2xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="font-heading text-2xl text-white/40">{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base md:text-lg text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {p.teams.map((t) => t.name).join(" · ")}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`font-heading text-4xl ${
                      isTop ? "text-[#C8A84B]" : "text-white/80"
                    }`}
                  >
                    {p.totalPoints}
                  </span>
                  <span className="text-xs text-white/40 ml-1">pts</span>
                </div>

                <span
                  className={`text-white/30 transition-transform text-sm ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

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

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/30">
        <span>🟢 Ganar = 3 puntos</span>
        <span>🟡 Empatar = 1 punto</span>
        <span>🔴 Perder = 0 puntos</span>
      </div>
    </section>
  );
}
