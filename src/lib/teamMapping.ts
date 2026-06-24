// Mapeo español → nombre oficial en football-data.org (FIFA).
// IMPORTANTE: las 15 entradas originales (marcadas ★) alimentan participants.json
// y la tabla de puntuaciones — NO modificar sus claves españolas ni sus valores.
export const TEAM_MAP: Record<string, string> = {
  // ── ★ Participantes de la familia (no cambiar) ──────────────────────────
  "Alemania":       "Germany",        // ★
  "Argentina":      "Argentina",      // ★
  "Austria":        "Austria",        // ★
  "Colombia":       "Colombia",       // ★
  "Corea del Sur":  "South Korea",     // ★
  "Corea":          "South Korea",     // alias (filtrado en REVERSE_MAP)
  "España":         "Spain",          // ★
  "Francia":        "France",         // ★
  "Inglaterra":     "England",        // ★
  "Japón":          "Japan",          // ★
  "México":         "Mexico",         // ★
  "Países Bajos":   "Netherlands",    // ★
  "Portugal":       "Portugal",       // ★
  "Senegal":        "Senegal",        // ★
  "Uzbekistán":     "Uzbekistan",     // ★

  // ── CONCACAF ─────────────────────────────────────────────────────────────
  "Estados Unidos": "United States",
  "Canadá":         "Canada",
  "Costa Rica":     "Costa Rica",
  "Honduras":       "Honduras",
  "Panamá":         "Panama",
  "Jamaica":        "Jamaica",
  "El Salvador":    "El Salvador",
  "Guatemala":      "Guatemala",
  "Trinidad y Tobago": "Trinidad and Tobago",
  "Cuba":           "Cuba",

  // ── CONMEBOL ─────────────────────────────────────────────────────────────
  "Brasil":         "Brazil",
  "Ecuador":        "Ecuador",
  "Uruguay":        "Uruguay",
  "Chile":          "Chile",
  "Paraguay":       "Paraguay",
  "Bolivia":        "Bolivia",
  "Venezuela":      "Venezuela",
  "Perú":           "Peru",

  // ── UEFA ─────────────────────────────────────────────────────────────────
  "Italia":         "Italy",
  "Bélgica":        "Belgium",
  "Suiza":          "Switzerland",
  "Croacia":        "Croatia",
  "Serbia":         "Serbia",
  "Dinamarca":      "Denmark",
  "Escocia":        "Scotland",
  "Turquía":        "Türkiye",
  "Georgia":        "Georgia",
  "Eslovenia":      "Slovenia",
  "Chequia":        "Czechia",
  "Hungría":        "Hungary",
  "Eslovaquia":     "Slovakia",
  "Rumanía":        "Romania",
  "Ucrania":        "Ukraine",
  "Albania":        "Albania",
  "Polonia":        "Poland",
  "Gales":          "Wales",
  "Irlanda":        "Republic of Ireland",
  "Grecia":         "Greece",
  "Noruega":        "Norway",

  // ── AFC ──────────────────────────────────────────────────────────────────
  "Arabia Saudita": "Saudi Arabia",
  "Australia":      "Australia",
  "Irán":           "Iran",
  "Irak":           "Iraq",
  "Jordania":       "Jordan",
  "Indonesia":      "Indonesia",
  "Emiratos Árabes Unidos": "United Arab Emirates",
  "Catar":          "Qatar",
  "Baréin":         "Bahrain",
  "Tayikistán":     "Tajikistan",

  // ── CAF ──────────────────────────────────────────────────────────────────
  "Marruecos":      "Morocco",
  "Nigeria":        "Nigeria",
  "Camerún":        "Cameroon",
  "Costa de Marfil": "Côte d'Ivoire",
  "Egipto":         "Egypt",
  "Ghana":          "Ghana",
  "Argelia":        "Algeria",
  "Túnez":          "Tunisia",
  "Mali":           "Mali",
  "Sudáfrica":      "South Africa",
  "Cabo Verde":     "Cape Verde",
  "Rep. Dem. del Congo": "DR Congo",
  "Zambia":         "Zambia",
  "Tanzania":       "Tanzania",

  // ── OFC ──────────────────────────────────────────────────────────────────
  "Nueva Zelanda":  "New Zealand",
};

export function toApiName(spanishName: string): string {
  return TEAM_MAP[spanishName] ?? spanishName;
}

// Reverso: nombre de la API → español.
// Se filtra "Corea" para evitar que sobreescriba "Corea del Sur" en el mapa inverso.
const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_MAP)
    .filter(([es]) => es !== "Corea")
    .map(([es, en]) => [en, es])
);

export function toSpanishName(apiName: string | null | undefined): string {
  if (!apiName) return "Por definir";
  return REVERSE_MAP[apiName] ?? apiName;
}

// Banderas emoji por nombre en español
export const TEAM_FLAGS: Record<string, string> = {
  // ── Participantes de la familia ──────────────────────────────────────────
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

  // ── CONCACAF ─────────────────────────────────────────────────────────────
  "Estados Unidos": "🇺🇸",
  "Canadá":         "🇨🇦",
  "Costa Rica":     "🇨🇷",
  "Honduras":       "🇭🇳",
  "Panamá":         "🇵🇦",
  "Jamaica":        "🇯🇲",
  "El Salvador":    "🇸🇻",
  "Guatemala":      "🇬🇹",
  "Trinidad y Tobago": "🇹🇹",
  "Cuba":           "🇨🇺",

  // ── CONMEBOL ─────────────────────────────────────────────────────────────
  "Brasil":         "🇧🇷",
  "Ecuador":        "🇪🇨",
  "Uruguay":        "🇺🇾",
  "Chile":          "🇨🇱",
  "Paraguay":       "🇵🇾",
  "Bolivia":        "🇧🇴",
  "Venezuela":      "🇻🇪",
  "Perú":           "🇵🇪",

  // ── UEFA ─────────────────────────────────────────────────────────────────
  "Italia":         "🇮🇹",
  "Bélgica":        "🇧🇪",
  "Suiza":          "🇨🇭",
  "Croacia":        "🇭🇷",
  "Serbia":         "🇷🇸",
  "Dinamarca":      "🇩🇰",
  "Escocia":        "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Turquía":        "🇹🇷",
  "Georgia":        "🇬🇪",
  "Eslovenia":      "🇸🇮",
  "Chequia":        "🇨🇿",
  "Hungría":        "🇭🇺",
  "Eslovaquia":     "🇸🇰",
  "Rumanía":        "🇷🇴",
  "Ucrania":        "🇺🇦",
  "Albania":        "🇦🇱",
  "Polonia":        "🇵🇱",
  "Gales":          "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Irlanda":        "🇮🇪",
  "Grecia":         "🇬🇷",
  "Noruega":        "🇳🇴",

  // ── AFC ──────────────────────────────────────────────────────────────────
  "Arabia Saudita": "🇸🇦",
  "Australia":      "🇦🇺",
  "Irán":           "🇮🇷",
  "Irak":           "🇮🇶",
  "Jordania":       "🇯🇴",
  "Indonesia":      "🇮🇩",
  "Emiratos Árabes Unidos": "🇦🇪",
  "Catar":          "🇶🇦",
  "Baréin":         "🇧🇭",
  "Tayikistán":     "🇹🇯",

  // ── CAF ──────────────────────────────────────────────────────────────────
  "Marruecos":      "🇲🇦",
  "Nigeria":        "🇳🇬",
  "Camerún":        "🇨🇲",
  "Costa de Marfil": "🇨🇮",
  "Egipto":         "🇪🇬",
  "Ghana":          "🇬🇭",
  "Argelia":        "🇩🇿",
  "Túnez":          "🇹🇳",
  "Mali":           "🇲🇱",
  "Sudáfrica":      "🇿🇦",
  "Cabo Verde":     "🇨🇻",
  "Rep. Dem. del Congo": "🇨🇩",
  "Zambia":         "🇿🇲",
  "Tanzania":       "🇹🇿",

  // ── OFC ──────────────────────────────────────────────────────────────────
  "Nueva Zelanda":  "🇳🇿",
};

export function getFlag(spanishName: string): string {
  return TEAM_FLAGS[spanishName] ?? "🏳️";
}
