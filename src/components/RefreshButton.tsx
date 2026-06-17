"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    router.refresh(); // Invalida el caché del Server Component y re-fetch la API
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="flex justify-center mb-8">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#C8A84B]/50 text-[#C8A84B] text-sm font-semibold hover:bg-[#C8A84B]/10 transition-all disabled:opacity-50 disabled:cursor-wait"
      >
        <span className={loading ? "animate-spin" : ""}>⟳</span>
        {loading ? "Actualizando…" : "Actualizar resultados"}
      </button>
    </div>
  );
}
