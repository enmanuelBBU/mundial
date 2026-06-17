import { NextResponse } from "next/server";
import participants from "@/data/participants.json";
import { getAllMatches, computeFamilyStandings, isDemoMode } from "@/lib/football";

export const revalidate = 300; // Next.js revalida esta ruta cada 5 minutos

export async function GET() {
  const matches = await getAllMatches();
  const standings = computeFamilyStandings(
    matches,
    participants as Record<string, string[]>
  );

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    isDemo: isDemoMode(),
    standings,
  });
}
