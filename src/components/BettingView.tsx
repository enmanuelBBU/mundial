"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApiMatch, Bet, MatchBetEntry, MoneyRankEntry, Prediction, SessionUser } from "@/lib/types";
import { toSpanishName } from "@/lib/teamMapping";
import { fmtDate, fmtTime, stageShort } from "@/lib/display";
import { loginAction, logoutAction, placeBetAction, editBetAction } from "@/lib/actions";
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
        <LoggedIn
          user={user}
          matches={matches}
          userBets={userBets}
          allMatchBets={allMatchBets}
          ranking={ranking}
        />
      ) : (
        <>
          <LoginForm familyNames={familyNames} allTeams={allTeams} />
          <MoneyRanking ranking={ranking} />
        </>
      )}
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
  ranking,
}: {
  user: SessionUser;
  matches: ApiMatch[];
  userBets: Bet[];
  allMatchBets: MatchBetEntry[];
  ranking: MoneyRankEntry[];
}) {
  const router = useRouter();
  const [, startLogout] = useTransition();
  const [section, setSection] = useState<"apostar" | "ranking" | "activas" | "todos">("apostar");

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

  const SECTIONS = [
    { id: "apostar" as const, label: "Apostar", icon: "🎯" },
    { id: "todos" as const, label: "Apuestas de todos", icon: "👥" },
    { id: "ranking" as const, label: "Ranking", icon: "💰" },
    { id: "activas" as const, label: "Mis apuestas", icon: "📋" },
  ];

  return (
    <div className="space-y-5">
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

      {/* Sub-nav de secciones */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              section === s.id
                ? "bg-[#C8A84B] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Apostar */}
      {section === "apostar" && (
        <div>
          <p className="text-xs text-white/40 mb-3">
            Aciertas el resultado y ganas el <b className="text-[#C8A84B]">doble</b>. Una apuesta por partido.
          </p>
          {bettable.length === 0 ? (
            <p className="text-white/40 text-sm py-4">No hay partidos disponibles para apostar ahora mismo.</p>
          ) : (
            <div className="space-y-3">
              {bettable.map((m) => (
                <BetCard key={m.id} m={m} balance={user.balance} allMatchBets={allMatchBets} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apuestas de todos */}
      {section === "todos" && (
        <AllBetsSection allMatchBets={allMatchBets} matches={matches} />
      )}

      {/* Ranking */}
      {section === "ranking" && <MoneyRanking ranking={ranking} meName={user.name} />}

      {/* Mis apuestas activas */}
      {section === "activas" && (
        <div>
          {userBets.length === 0 ? (
            <p className="text-white/40 text-sm">Todavía no has hecho ninguna apuesta.</p>
          ) : (
            <div className="space-y-3">
              {userBets.map((b) => (
                <MyBetRow
                  key={b.id}
                  bet={b}
                  match={matchById.get(b.matchId)}
                  allMatchBets={allMatchBets}
                  userBalance={user.balance}
                />
              ))}
            </div>
          )}
        </div>
      )}
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
    <div className="glass-card border p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 min-w-0 mb-1">
          <Crest src={m.homeCrest} size={28} />
          <span className="truncate font-bold text-white text-lg">{toSpanishName(m.home)}</span>
          <span className="text-white/30 mx-1 text-lg">vs</span>
          <span className="truncate font-bold text-white text-lg">{toSpanishName(m.away)}</span>
          <Crest src={m.awayCrest} size={28} />
        </div>
        <span className="text-sm text-white/40">
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
            className="w-24 rounded-lg bg-white/5 border border-white/15 px-3 py-2.5 text-white text-base"
          />
          <div className="grid grid-cols-3 gap-2 flex-1">
            {options.map((o) => (
              <button
                key={o.p}
                onClick={() => setConfirm(o.p)}
                disabled={pending || amount < 1 || amount > balance}
                className="px-2 py-2.5 rounded-lg bg-white/5 hover:bg-[#C8A84B] hover:text-black text-white/80 text-sm font-semibold truncate disabled:opacity-40 transition-colors"
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
        className="mt-3 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        {expanded ? "▲" : "▼"} Apuestas de todos ({matchBets.length})
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          {matchBets.length === 0 ? (
            <p className="text-sm text-white/30 pl-1">Nadie apostó aún.</p>
          ) : (
            matchBets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-white/3">
                <span className="font-semibold text-white/90">{b.userName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/80 font-medium">
                  {b.prediction === "HOME"
                    ? toSpanishName(m.home)
                    : b.prediction === "AWAY"
                    ? toSpanishName(m.away)
                    : "Empate"}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{coins(b.amount)}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status].cls}`}>
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
  userBalance,
}: {
  bet: Bet;
  match: ApiMatch | undefined;
  allMatchBets: MatchBetEntry[];
  userBalance: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(bet.amount);
  const [editConfirm, setEditConfirm] = useState<Prediction | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const badge = STATUS_BADGE[bet.status];
  const pick =
    bet.prediction === "HOME"
      ? toSpanishName(match?.home)
      : bet.prediction === "AWAY"
      ? toSpanishName(match?.away)
      : "Empate";

  const canEdit =
    bet.status === "PENDING" &&
    match != null &&
    !["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status) &&
    new Date(match.utcDate).getTime() > Date.now();

  const maxAmount = userBalance + bet.amount;

  const saveEdit = (prediction: Prediction) => {
    setEditError(null);
    setEditConfirm(null);
    start(async () => {
      const res = await editBetAction(bet.id, bet.matchId, prediction, editAmount);
      if (res.ok) { setEditing(false); router.refresh(); }
      else setEditError(res.error ?? "Error al editar.");
    });
  };

  const editOptions: { p: Prediction; label: string }[] = [
    { p: "HOME", label: toSpanishName(match?.home) },
    { p: "DRAW", label: "Empate" },
    { p: "AWAY", label: toSpanishName(match?.away) },
  ];

  const matchBets = useMemo(
    () => allMatchBets.filter((b) => b.matchId === bet.matchId),
    [allMatchBets, bet.matchId]
  );

  return (
    <div className="glass-card border px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base truncate">
            {match ? `${toSpanishName(match.home)} vs ${toSpanishName(match.away)}` : "Partido"}
          </p>
          <p className="text-sm text-white/50 mt-0.5">
            Apostaste {coins(bet.amount)} a <b className="text-white/80">{pick}</b>
          </p>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.txt}</span>
          {bet.status === "WON" && (
            <p className="text-green-400 text-sm font-bold">+{coins(bet.payout)}</p>
          )}
          {bet.status === "LOST" && (
            <p className="text-red-400 text-sm">-{coins(bet.amount)}</p>
          )}
          {canEdit && !editing && (
            <button
              onClick={() => { setEditing(true); setEditAmount(bet.amount); setEditConfirm(null); setEditError(null); }}
              className="text-xs text-[#C8A84B] hover:text-[#e8c76b] transition-colors"
            >
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 border-t border-white/10 pt-3">
          {editConfirm ? (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-white/70 flex-1 min-w-0">
                ¿Cambiar a {coins(editAmount)} a <b className="text-white">{editOptions.find((o) => o.p === editConfirm)?.label}</b>?
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => saveEdit(editConfirm)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-[#C8A84B] text-black text-xs font-bold disabled:opacity-40"
                >
                  {pending ? "…" : "Confirmar"}
                </button>
                <button
                  onClick={() => setEditConfirm(null)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/15"
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
                max={maxAmount}
                value={editAmount}
                onChange={(e) => setEditAmount(Math.max(1, Math.floor(+e.target.value || 0)))}
                className="w-24 rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white text-base"
              />
              <div className="grid grid-cols-3 gap-2 flex-1">
                {editOptions.map((o) => (
                  <button
                    key={o.p}
                    onClick={() => setEditConfirm(o.p)}
                    disabled={pending || editAmount < 1 || editAmount > maxAmount}
                    className={`px-2 py-2 rounded-lg text-sm font-semibold truncate disabled:opacity-40 transition-colors ${
                      o.p === bet.prediction
                        ? "bg-[#C8A84B]/30 text-[#C8A84B] border border-[#C8A84B]/50"
                        : "bg-white/5 hover:bg-[#C8A84B] hover:text-black text-white/80"
                    }`}
                    title={`Cambiar a ${o.label}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-white/40 hover:text-white/70 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}
          {editError && <p className="text-red-400 text-xs mt-2">{editError}</p>}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        {expanded ? "▲" : "▼"} Apuestas de todos ({matchBets.length})
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          {matchBets.length === 0 ? (
            <p className="text-sm text-white/30 pl-1">Nadie apostó.</p>
          ) : (
            matchBets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-white/3">
                <span className="font-semibold text-white/90">{b.userName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/80 font-medium">
                  {b.prediction === "HOME"
                    ? toSpanishName(match?.home)
                    : b.prediction === "AWAY"
                    ? toSpanishName(match?.away)
                    : "Empate"}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{coins(b.amount)}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status].cls}`}>
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

// ─── Apuestas de todos agrupadas por partido ────────────────────────────────
function AllBetsSection({
  allMatchBets,
  matches,
}: {
  allMatchBets: MatchBetEntry[];
  matches: ApiMatch[];
}) {
  const matchById = useMemo(() => {
    const m = new Map<number, ApiMatch>();
    matches.forEach((x) => m.set(x.id, x));
    return m;
  }, [matches]);

  const grouped = useMemo(() => {
    const map = new Map<number, MatchBetEntry[]>();
    for (const b of allMatchBets) {
      if (!map.has(b.matchId)) map.set(b.matchId, []);
      map.get(b.matchId)!.push(b);
    }
    return [...map.entries()]
      .map(([matchId, bets]) => ({ match: matchById.get(matchId), bets }))
      .sort((a, b) => {
        if (!a.match || !b.match) return 0;
        return +new Date(a.match.utcDate) - +new Date(b.match.utcDate);
      });
  }, [allMatchBets, matchById]);

  if (grouped.length === 0) {
    return <p className="text-white/40 text-sm">Nadie ha apostado aún.</p>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ match, bets }) => (
        <div key={bets[0].matchId} className="glass-card border p-5">
          {match && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Crest src={match.homeCrest} size={24} />
              <span className="font-bold text-white text-base">{toSpanishName(match.home)}</span>
              <span className="text-white/30">vs</span>
              <span className="font-bold text-white text-base">{toSpanishName(match.away)}</span>
              <Crest src={match.awayCrest} size={24} />
              <span className="ml-auto text-sm text-white/30 whitespace-nowrap">
                {fmtDate(match.utcDate)} {fmtTime(match.utcDate)}
              </span>
            </div>
          )}
          <div className="space-y-2">
            {bets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-2 py-2 rounded-lg bg-white/3">
                <span className="font-semibold text-white/90">{b.userName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/80 font-medium">
                  {b.prediction === "HOME"
                    ? toSpanishName(match?.home)
                    : b.prediction === "AWAY"
                    ? toSpanishName(match?.away)
                    : "Empate"}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{coins(b.amount)}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status].cls}`}>
                  {STATUS_BADGE[b.status].txt}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
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
