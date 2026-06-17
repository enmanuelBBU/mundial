"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiMatch, GroupTable, ParticipantResult } from "@/lib/types";
import RankingTable from "./RankingTable";
import MatchesView from "./MatchesView";
import TeamsView from "./TeamsView";
import GroupsView from "./GroupsView";

type Tab = "ranking" | "partidos" | "equipos" | "grupos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "ranking", label: "Ranking", icon: "🏆" },
  { id: "partidos", label: "Partidos", icon: "⚽" },
  { id: "equipos", label: "Equipos", icon: "🎽" },
  { id: "grupos", label: "Grupos", icon: "📊" },
];

interface Props {
  standings: ParticipantResult[];
  matches: ApiMatch[];
  groups: GroupTable[];
  familyTeams: string[];
  updatedAt: string;
  isDemo: boolean;
}

export default function Dashboard({
  standings,
  matches,
  groups,
  familyTeams,
  updatedAt,
  isDemo,
}: Props) {
  const [tab, setTab] = useState<Tab>("ranking");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Auto-actualización cada 60 segundos (re-ejecuta el Server Component y
  // vuelve a consultar la API sin recargar la página).
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  const manualRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  const fmt = new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {isDemo && (
        <div className="mb-5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300 text-center">
          ⚠️ Modo demo — datos simulados. Configura <code className="font-mono">FOOTBALL_API_KEY</code>{" "}
          para resultados reales.
        </div>
      )}

      {/* Navegación por pestañas */}
      <nav className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.id
                ? "bg-[#C8A84B] text-black shadow-lg shadow-[#C8A84B]/20"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Barra de estado / refresco */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-white/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Actualiza solo · {fmt.format(new Date(updatedAt))}
        </p>
        <button
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#C8A84B] hover:text-[#e8c76b] transition-colors disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin" : ""}>⟳</span>
          {refreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      {tab === "ranking" && <RankingTable standings={standings} />}
      {tab === "partidos" && <MatchesView matches={matches} />}
      {tab === "equipos" && <TeamsView matches={matches} familyTeams={familyTeams} />}
      {tab === "grupos" && <GroupsView groups={groups} matches={matches} />}
    </div>
  );
}
