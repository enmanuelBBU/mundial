import { getFlag } from "@/lib/teamMapping";

interface Props {
  name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
}

export default function TeamBadge({ name, points, wins, draws, losses, played }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
      <span className="text-2xl leading-none">{getFlag(name)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="text-xs text-white/40">
          {played > 0 ? `${wins}G ${draws}E ${losses}P` : "Sin partidos"}
        </p>
      </div>
      <span className="text-base font-bold text-[#C8A84B] tabular-nums">{points}pts</span>
    </div>
  );
}
