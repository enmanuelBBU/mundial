"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApiMatch, Bet, MatchBetEntry, MoneyRankEntry, Prediction, SessionUser } from "@/lib/types";
import { toSpanishName } from "@/lib/teamMapping";
import { fmtDate, fmtTime, stageShort } from "@/lib/display";
import { loginAction, logoutAction, placeBetAction } from "@/lib/actions";
import Crest from "./Crest";

const PRED_LABEL: Record<Prediction, string> = {
  HOME: "Local",
  DRAW: "Empate",
  AWAY: "Visitante",
};
const STATUS_BADGE: Record<string, { txt: string; cls: string }> = {
  PENDING: { txt: "Pendiente", cls: "bg-white/10 text-white/60" },
  WON: { txt: "Ganada", cls: "bg-green-500/20 text-green-400" },
  LOST: { txt: "Perdida", cls: "bg-red-500/20 text-red-400" },
};

const coins = (n: number) => `${n.toLocaleString("es-VE")} 🪙`;

interface Props {
  configured: boolean;
  user: SessionUser | null;
  matches: ApiMatch[];
  userBets: Bet[];
  ranking: MoneyRankEntry[];
  allMatchBets: MatchBetEntry[];
  familyNames: string[];
  allTeams: string[];
}

export default function BettingView({
  configured,
  user,
  matches,
  userBets,
  ranking,
  allMatchBets,
  familyNames,
  allTeams,
}: Props) {
  if (!configured) {
    return (
      <div className="animate-slide-in glass-card border p-6 text-center text-white/60">
        💰 La sección de apuestas todavía no está conectada a la base de datos.
        <p className="text-xs text-white/40 mt-2">
          Configura Supabase (variables <code>SUPABASE_URL</code>,{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> y <code>SESSION_SECRET</code>) para activarla.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-slide-in space-y-8">
      {user ? (
        <LoggedIn user={user} matches={matches} userBets={userBets} allMatchBets={allMatchBets} />
      ) : (
        <LoginForm familyNames={familyNames} allTeams={allTeams} />
      )}

      <MoneyRanking ranking={ranking} meName={user?.name} />
    </div>
  );
}

// ─── Login (nombre + PIN) ───────────────────────────────────────────────────
function LoginForm({ familyNames, allTeams }: { familyNames: string[]; allTeams: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [isNew, setIsNew] = useState(false);
  // Paso del flujo para nuevos participantes: 1 = nombre+PIN, 2 = equipos
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const resetForm = (newMode: boolean) => {
    setIsNew(newMode);
    setName("");
    setPin("");
    setError(null);
    setStep(1);
    setSelectedTeams([]);
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team)
        ? prev.filter((t) => t !== team)         // deseleccionar
        : prev.length < 3 ? [...prev, team] : prev // max 3
    );
  };

  const goToStep2 = () => {
    setError(null);
    if (!name.trim()) { setError("Escribe tu nombre."); return; }
    if (pin.length !== 4) { setError("El PIN debe tener 4 dígitos."); return; }
    setStep(2);
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await loginAction(name.trim(), pin, selectedTeams);
      if (res.ok) router.refresh();
      else { setStep(1); setError(res.error ?? "Error al entrar."); }
    });
  };

  const submitExisting = () => {
    setError(null);
    start(async () => {
      const res = await loginAction(name, pin);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Error al entrar.");
    });
  };

  // ── Paso 2: selector de equipos ──
  if (isNew && step === 2) {
    return (
      <div className="glass-card border p-6 max-w-lg mx-auto">
        <button
          onClick={() => setStep(1)}
          className="text-xs text-white/40 hover:text-white/70 mb-4 flex items-center gap-1"
        >
          ← Volver
        </button>
        <h3 className="font-heading text-2xl text-[#C8A84B] tracking-wider mb-1 text-center">
          ELIGE TUS 3 EQUIPOS
        </h3>
        <p className="text-xs text-white/40 text-center mb-4">
          Escoge exactamente 3 selecciones. Tus puntos en el ranking dependerán de cómo les vaya a estos equipos.
        </p>

        {/* Contador */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                selectedTeams[i]
                  ? "border-[#C8A84B] bg-[#C8A84B]/20 text-[#C8A84B]"
                  : "border-white/20 text-white/20"
              }`}
            >
              {selectedTeams[i] ? "✓" : i + 1}
            </div>
          ))}
        </div>

        {/* Grid de equipos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 mb-4">
          {allTeams.map((team) => {
            const selected = selectedTeams.includes(team);
            const disabled = !selected && selectedTeams.length >= 3;
            return (
              <button
                key={team}
                onClick={() => toggleTeam(team)}
                disabled={disabled}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selected
                    ? "bg-[#C8A84B] text-black"
                    : disabled
                    ? "bg-white/3 text-white/20 cursor-not-allowed"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {team}
              </button>
            );
          })}
        </div>

        {/* Seleccionados */}
        {selectedTeams.length > 0 && (
          <p className="text-xs text-white/50 text-center mb-3">
            Seleccionados: <span className="text-[#C8A84B] font-semibold">{selectedTeams.join(" · ")}</span>
          </p>
        )}

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        <button
          onClick={submit}
          disabled={pending || selectedTeams.length !== 3}
          className="w-full py-2.5 rounded-lg bg-[#C8A84B] text-black font-bold disabled:opacity-40 transition-opacity"
        >
          {pending ? "Creando cuenta…" : `✨ Crear cuenta con ${selectedTeams.length}/3 equipos`}
        </button>
      </div>
    );
  }

  // ── Paso 1: nombre + PIN (o login existente) ──
  return (
    <div className="glass-card border p-6 max-w-sm mx-auto">
      <h3 className="font-heading text-2xl text-[#C8A84B] tracking-wider mb-1 text-center">
        {isNew ? "NUEVO PARTICIPANTE" : "ENTRAR PARA APOSTAR"}
      </h3>
      <p className="text-xs text-white/40 text-center mb-4">
        {isNew
          ? "Escribe tu nombre y crea un PIN de 4 dígitos para unirte."
          : "El login es opcional (solo para apostar). Si es tu primera vez, elige tu nombre y crea un PIN de 4 dígitos."}
      </p>

      {/* Toggle participante nuevo / existente */}
      <div className="flex rounded-lg overflow-hidden border border-white/10 mb-4 text-xs font-semibold">
        <button
          onClick={() => resetForm(false)}
          className={`flex-1 py-2 transition-colors ${
            !isNew
              ? "bg-[#C8A84B] text-black"
              : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}
        >
          Soy participante
        </button>
        <button
          onClick={() => resetForm(true)}
          className={`flex-1 py-2 transition-colors ${
            isNew
              ? "bg-[#C8A84B] text-black"
              : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}
        >
          ✨ Nuevo participante
        </button>
      </div>

      <label className="block text-xs text-white/50 mb-1">Tu nombre</label>

      {isNew ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Escribe tu nombre…"
          maxLength={40}
          className="w-full mb-3 rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white placeholder:text-white/25"
        />
      ) : (
        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
        >
          <option value="">— Elige tu nombre —</option>
          {familyNames.map((n) => (
            <option key={n} value={n} className="bg-[#0d1117]">
              {n}
            </option>
          ))}
        </select>
      )}

      <label className="block text-xs text-white/50 mb-1">PIN (4 dígitos)</label>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        placeholder="••••"
        className="w-full mb-4 rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white tracking-[0.5em] text-center"
      />

      {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

      {isNew ? (
        <button
          onClick={goToStep2}
          disabled={!name.trim() || pin.length !== 4}
          className="w-full py-2.5 rounded-lg bg-[#C8A84B] text-black font-bold disabled:opacity-40 transition-opacity"
        >
          Siguiente: elegir equipos →
        </button>
      ) : (
        <button
          onClick={submitExisting}
          disabled={pending || !name || pin.length !== 4}
          className="w-full py-2.5 rounded-lg bg-[#C8A84B] text-black font-bold disabled:opacity-40 transition-opacity"
        >
          {pending ? "Entrando…" : "Entrar / Crear cuenta"}
        </button>
      )}
    </div>
  );
}

// ─── Vista con sesión iniciada ──────────────────────────────────────────────
function LoggedIn({
  user,
  matches,
  userBets,
  allMatchBets,
}: {
  user: SessionUser;
  matches: ApiMatch[];
  userBets: Bet[];
  allMatchBets: MatchBetEntry[];
}) {
  const router = useRouter();
  const [, startLogout] = useTransition();

  const matchById = useMemo(() => {
    const m = new Map<number, ApiMatch>();
    matches.forEach((x) => m.set(x.id, x));
    return m;
  }, [matches]);

  const betMatchIds = useMemo(() => new Set(userBets.map((b) => b.matchId)), [userBets]);

  const bettable = useMemo(
    () =>
      matches
        .filter(
          (m) =>
            m.home &&
            m.away &&
            !["FINISHED", "IN_PLAY", "PAUSED"].includes(m.status) &&
            new Date(m.utcDate).getTime() > Date.now() &&
            !betMatchIds.has(m.id)
        )
        .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
        .slice(0, 15),
    [matches, betMatchIds]
  );

  return (
    <div className="space-y-7">
      {/* Saldo + sesión */}
      <div className="glass-card border rank-1 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Tu saldo, {user.name}</p>
          <p className="font-heading text-4xl text-[#C8A84B] leading-none mt-1">
            {coins(user.balance)}
          </p>
        </div>
        <button
          onClick={() => startLogout(async () => {
            await logoutAction();
            router.refresh();
          })}
          className="text-xs text-white/50 hover:text-white border border-white/15 rounded-full px-3 py-1.5"
        >
          Salir
        </button>
      </div>

      {/* Apostar */}
      <div>
        <h3 className="font-heading text-xl text-white/80 tracking-wider mb-1">APOSTAR</h3>
        <p className="text-xs text-white/40 mb-3">
          Aciertas el resultado y ganas el <b className="text-[#C8A84B]">doble</b>. Una apuesta por
          partido.
        </p>
        {bettable.length === 0 ? (
          <p className="text-white/40 text-sm py-4">
            No hay partidos disponibles para apostar ahora mismo.
          </p>
        ) : (
          <div className="space-y-3">
            {bettable.map((m) => (
              <BetCard key={m.id} m={m} balance={user.balance} allMatchBets={allMatchBets} />
            ))}
          </div>
        )}
      </div>

      {/* Mis apuestas */}
      <div>
        <h3 className="font-heading text-xl text-white/80 tracking-wider mb-3">MIS APUESTAS</h3>
        {userBets.length === 0 ? (
          <p className="text-white/40 text-sm">Todavía no has hecho ninguna apuesta.</p>
        ) : (
          <div className="space-y-2">
            {userBets.map((b) => (
              <MyBetRow
                key={b.id}
                bet={b}
                match={matchById.get(b.matchId)}
                allMatchBets={allMatchBets}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BetCard({
  m,
  balance,
  allMatchBets,
}: {
  m: ApiMatch;
  balance: number;
  allMatchBets: MatchBetEntry[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<Prediction | null>(null);
  const [expanded, setExpanded] = useState(false);

  const matchBets = useMemo(
    () => allMatchBets.filter((b) => b.matchId === m.id),
    [allMatchBets, m.id]
  );

  const bet = (prediction: Prediction) => {
    setError(null);
    setConfirm(null);
    start(async () => {
      const res = await placeBetAction(m.id, prediction, amount);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Error al apostar.");
    });
  };

  const options: { p: Prediction; label: string }[] = [
    { p: "HOME", label: toSpanishName(m.home) },
    { p: "DRAW", label: "Empate" },
    { p: "AWAY", label: toSpanishName(m.away) },
  ];

  return (
    <div className="glass-card border p-3">
      <div className="flex items-center justify-between mb-2 text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <Crest src={m.homeCrest} size={18} />
          <span className="truncate text-white/80">{toSpanishName(m.home)}</span>
          <span className="text-white/30 mx-1">vs</span>
          <span className="truncate text-white/80">{toSpanishName(m.away)}</span>
          <Crest src={m.awayCrest} size={18} />
        </div>
        <span className="text-[10px] text-white/30 whitespace-nowrap ml-2">
          {stageShort(m.stage)} · {fmtDate(m.utcDate)} {fmtTime(m.utcDate)}
        </span>
      </div>

      {confirm ? (
        <div className="flex items-center gap-2 flex-wrap py-1">
          <p className="text-xs text-white/70 flex-1 min-w-0">
            ¿Apostar {coins(amount)} a{" "}
            <b className="text-white">{options.find((o) => o.p === confirm)?.label}</b>?
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => bet(confirm)}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-[#C8A84B] text-black text-xs font-bold disabled:opacity-40 transition-opacity"
            >
              {pending ? "…" : "Confirmar"}
            </button>
            <button
              onClick={() => setConfirm(null)}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/15 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={balance}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Math.floor(+e.target.value || 0)))}
            className="w-20 rounded-lg bg-white/5 border border-white/15 px-2 py-1.5 text-white text-sm"
          />
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {options.map((o) => (
              <button
                key={o.p}
                onClick={() => setConfirm(o.p)}
                disabled={pending || amount < 1 || amount > balance}
                className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-[#C8A84B] hover:text-black text-white/80 text-xs font-semibold truncate disabled:opacity-40 transition-colors"
                title={`Apostar a ${o.label}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
      >
        {expanded ? "▲" : "▼"} Apuestas de todos ({matchBets.length})
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
          {matchBets.length === 0 ? (
            <p className="text-[10px] text-white/30 pl-1">Nadie apostó aún.</p>
          ) : (
            matchBets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] px-1">
                <span className="font-semibold text-white/70">{b.userName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{PRED_LABEL[b.prediction]}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40">{coins(b.amount)}</span>
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[b.status].cls}`}>
                  {STATUS_BADGE[b.status].txt}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MyBetRow({
  bet,
  match,
  allMatchBets,
}: {
  bet: Bet;
  match: ApiMatch | undefined;
  allMatchBets: MatchBetEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = STATUS_BADGE[bet.status];
  const pick =
    bet.prediction === "HOME"
      ? toSpanishName(match?.home)
      : bet.prediction === "AWAY"
      ? toSpanishName(match?.away)
      : "Empate";

  const matchBets = useMemo(
    () => allMatchBets.filter((b) => b.matchId === bet.matchId),
    [allMatchBets, bet.matchId]
  );

  return (
    <div className="glass-card border px-4 py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white/80 truncate">
            {match ? `${toSpanishName(match.home)} vs ${toSpanishName(match.away)}` : "Partido"}
          </p>
          <p className="text-xs text-white/40">
            Apostaste {coins(bet.amount)} a <b>{PRED_LABEL[bet.prediction]}</b> ({pick})
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.txt}</span>
          {bet.status === "WON" && (
            <p className="text-green-400 text-xs font-bold mt-1">+{coins(bet.payout)}</p>
          )}
          {bet.status === "LOST" && (
            <p className="text-red-400 text-xs mt-1">-{coins(bet.amount)}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
      >
        {expanded ? "▲" : "▼"} Apuestas de todos ({matchBets.length})
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
          {matchBets.length === 0 ? (
            <p className="text-[10px] text-white/30 pl-1">Nadie apostó.</p>
          ) : (
            matchBets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] px-1">
                <span className="font-semibold text-white/70">{b.userName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{PRED_LABEL[b.prediction]}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40">{coins(b.amount)}</span>
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[b.status].cls}`}>
                  {STATUS_BADGE[b.status].txt}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ranking de dinero ──────────────────────────────────────────────────────
function MoneyRanking({ ranking, meName }: { ranking: MoneyRankEntry[]; meName?: string }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <h3 className="font-heading text-xl text-white/80 tracking-wider mb-3">
        💰 RANKING DE DINERO
      </h3>
      {ranking.length === 0 ? (
        <p className="text-white/40 text-sm">Aún no hay jugadores. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-2">
          {ranking.map((r, i) => (
            <div
              key={r.name}
              className={`glass-card border px-4 py-2.5 flex items-center gap-3 ${
                i < 3 ? RANK_CLASS[i] : ""
              } ${r.name === meName ? "ring-1 ring-[#C8A84B]/50" : ""}`}
            >
              <span className="w-7 text-center font-heading text-xl text-white/50">
                {i < 3 ? medals[i] : i + 1}
              </span>
              <span className="flex-1 font-semibold text-white truncate">{r.name}</span>
              <span className="font-bold text-[#C8A84B] tabular-nums">{coins(r.balance)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const RANK_CLASS = ["rank-1", "rank-2", "rank-3"];
