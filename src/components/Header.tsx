export default function Header() {
  return (
    <header className="relative overflow-hidden py-10 text-center">
      {/* Líneas decorativas de campo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-40 h-40 rounded-full border-4 border-white" />
      </div>

      <div className="relative z-10">
        <p className="text-sm font-semibold tracking-[0.3em] text-[#C8A84B] uppercase mb-2">
          ⚽ FIFA World Cup
        </p>
        <h1 className="font-heading text-6xl md:text-8xl gold-gradient leading-none mb-1">
          MUNDIAL 2026
        </h1>
        <h2 className="font-heading text-3xl md:text-4xl text-white/80 tracking-widest">
          FAMILIA BARRERA
        </h2>
        <div className="mt-4 flex justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/60 border border-white/10">
            🇺🇸 Estados Unidos &nbsp;·&nbsp; 🇨🇦 Canadá &nbsp;·&nbsp; 🇲🇽 México
          </span>
        </div>
      </div>
    </header>
  );
}
