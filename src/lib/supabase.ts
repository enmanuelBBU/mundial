import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase para el SERVIDOR (usa la service role key → acceso total).
// NUNCA se importa desde componentes cliente; todo el acceso pasa por acciones
// de servidor y route handlers protegidos por la sesión.

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isBettingConfigured(): boolean {
  return Boolean(URL && SERVICE_KEY && process.env.SESSION_SECRET);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!URL || !SERVICE_KEY) {
    throw new Error("Supabase no está configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!client) {
    client = createClient(URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
