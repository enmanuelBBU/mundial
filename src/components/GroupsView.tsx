"use client";

import type { ApiMatch, GroupTable } from "@/lib/types";
import { toSpanishName } from "@/lib/teamMapping";
import {
  KNOCKOUT_ORDER,
  fmtDate,
  groupLabel,
  isFinished,
  isLive,
  stageLabel,
} from "@/lib/display";
import Crest from "./Crest";

export default function GroupsView({
  groups,
  matches,
}: {
  groups: GroupTable[];
  matches: ApiMatch[];
}) {
  return (
    <div className="animate-slide-in space-y-8">
      {/* ── Tablas de grupos ── */}
      <div>
        <h4 className="font-heading text-xl text-white/80 tracking-wider mb-3">
          FASE DE GRUPOS
        </h4>
        {groups.length === 0 ? (
          <p className="text-white/40 text-sm">Aún no hay datos de grupos.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {groups.map((g) => (
              <div key={g.group} className="glass-card border p-3">
                <div className="font-bold text-[#C8A84B] text-sm mb-2 px-1">
                  {groupLabel(g.group)}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase text-white/30">
                      <th className="text-left font-medium pb-1">Equipo</th>
                      <th className="w-8 text-center font-medium">PJ</th>
                      <th className="w-8 text-center font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => {
                      const advances = r.position <= 2;
                      return (
                        <tr
                          key={r.team}
                          className={`border-t border-white/5 ${
                            advances ? "text-white" : "text-white/60"
                          }`}
                        >
                          <td className="py-1.5 flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                advances ? "bg-green-500" : "bg-transparent"
                              }`}
                            />
                            <Crest src={r.crest} size={18} />
                            <span className="truncate">{toSpanishName(r.team)}</span>
                          </td>
                          <td className="text-center tabular-nums text-white/50">{r.played}</td>
                          <td className="text-center font-bold tabular-nums">{r.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-white/30 mt-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Avanzan a la siguiente
          ronda (top 2 + mejores terceros)
        </p>
      </div>

      {/* ── Bracket eliminatorio ── */}
      <div>
        <h4 className="font-heading text-xl text-white/80 tracking-wider mb-3">
          CAMINO A LA FINAL
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4">
          {KNOCKOUT_ORDER.map((stage) => {
            const stageMatches = matches
              .filter((m) => m.stage === stage)
              .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
            return (
              <div key={stage} className="flex-shrink-0 w-44">
                <div className="text-center text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  {stageLabel(stage)}
                </div>
                <div className="space-y-2">
                  {stageMatches.map((m) => (
                    <KnockoutCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KnockoutCard({ m }: { m: ApiMatch }) {
  const tbdHome = !m.home;
  const tbdAway = !m.away;
  const done = isFinished(m);
  const live = isLive(m);

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

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-xs ${
        tbdHome && tbdAway
          ? "border-white/8 bg-white/[0.02] text-white/30"
          : "border-white/12 bg-white/5 text-white/80"
      }`}
    >
      <TeamLine
        name={toSpanishName(m.home)}
        crest={m.homeCrest}
        goals={done || live ? m.homeGoals : null}
        penalties={done && m.duration === "PENALTY_SHOOTOUT" ? m.penaltiesHome : null}
        winner={winner === "HOME_TEAM"}
        tbd={tbdHome}
      />
      <div className="h-px bg-white/8 my-1" />
      <TeamLine
        name={toSpanishName(m.away)}
        crest={m.awayCrest}
        goals={done || live ? m.awayGoals : null}
        penalties={done && m.duration === "PENALTY_SHOOTOUT" ? m.penaltiesAway : null}
        winner={winner === "AWAY_TEAM"}
        tbd={tbdAway}
      />
      <div className="text-[10px] text-white/30 text-center mt-1.5">
        {live ? (
          <span className="text-red-400 font-semibold">● EN VIVO</span>
        ) : (
          fmtDate(m.utcDate)
        )}
      </div>
    </div>
  );
}

function TeamLine({
  name,
  crest,
  goals,
  penalties,
  winner,
  tbd,
}: {
  name: string;
  crest: string | null;
  goals: number | null;
  penalties?: number | null;
  winner: boolean;
  tbd: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {!tbd && <Crest src={crest} size={16} />}
      <span className={`flex-1 truncate ${winner ? "font-bold text-white" : ""}`}>
        {tbd ? "Por definir" : name}
      </span>
      {goals !== null && (
        <span className="font-bold tabular-nums flex items-center gap-0.5">
          {goals}
          {penalties !== undefined && penalties !== null && (
            <span className="text-[10px] text-white/50 font-normal">({penalties})</span>
          )}
        </span>
      )}
    </div>
  );
}
