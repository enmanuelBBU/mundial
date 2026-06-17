// Se ejecuta una sola vez cuando arranca el servidor de Next.js, antes de
// atender cualquier petición. Repara el localStorage roto de Node 25.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { fixServerStorage } = await import("./lib/fixServerStorage");
    fixServerStorage();
  }
}
