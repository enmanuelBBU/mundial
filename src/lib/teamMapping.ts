// Mapeo de nombres en español → nombre oficial en la API (football-data.org)
export const TEAM_MAP: Record<string, string> = {
  "Alemania":       "Germany",
  "Argentina":      "Argentina",
  "Austria":        "Austria",
  "Colombia":       "Colombia",
  "Corea del Sur":  "Korea Republic",
  "Corea":          "Korea Republic",
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
