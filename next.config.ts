import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FOOTBALL_API_KEY se lee con process.env directamente en el servidor
  // (Server Components y rutas API). No la mapeamos aquí para evitar
  // incrustar el secreto en el build y para que los cambios de variable
  // en Vercel surtan efecto en runtime sin necesidad de reconstruir.
};

export default nextConfig;
