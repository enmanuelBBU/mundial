// Mapeo de nombres en español → nombre oficial en la API (football-data.org)
export const TEAM_MAP: Record<string, string> = {
  "Alemania":       "Germany",
  "Argentina":      "Argentina",
  "Austria":        "Austria",
  "Colombia":       "Colombia",
  "Corea del Sur":  "South Korea",
  "Corea":          "South Korea",
  "España":         "Spain",
  "Francia":        "France",
  "Inglaterra":     "England",
  "Japón":          "Japan",
  "México":         "Mexico",
  "Países Bajos":   "Netherlands",
  "Portugal":       "Portugal",
  "Senegal":        "Senegal",
  "Uzbekistán":     "Uzbekistan",
};

export function toApiName(spanishName: string): string {
  return TEAM_MAP[spanishName] ?? spanishName;
}

// Reverso: nombre de la API (inglés) → español, para los equipos que conocemos.
// Los que no estén mapeados se muestran con su nombre oficial en inglés.
const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_MAP)
    .filter(([es]) => es !== "Corea") // evita duplicado de Corea del Sur
    .map(([es, en]) => [en, es])
);

export function toSpanishName(apiName: string | null | undefined): string {
  if (!apiName) return "Por definir";
  return REVERSE_MAP[apiName] ?? apiName;
}

// Banderas emoji por nombre en español
export const TEAM_FLAGS: Record<string, string> = {
  "Alemania":       "🇩🇪",
  "Argentina":      "🇦🇷",
  "Austria":        "🇦🇹",
  "Colombia":       "🇨🇴",
  "Corea del Sur":  "🇰🇷",
  "Corea":          "🇰🇷",
  "España":         "🇪🇸",
  "Francia":        "🇫🇷",
  "Inglaterra":     "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Japón":          "🇯🇵",
  "México":         "🇲🇽",
  "Países Bajos":   "🇳🇱",
  "Portugal":       "🇵🇹",
  "Senegal":        "🇸🇳",
  "Uzbekistán":     "🇺🇿",
};

export function getFlag(spanishName: string): string {
  return TEAM_FLAGS[spanishName] ?? "🏳️";
}
