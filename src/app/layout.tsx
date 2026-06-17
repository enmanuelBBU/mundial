import "@/lib/fixServerStorage"; // repara localStorage roto de Node 25 (debe ir primero)
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mundial 2026 · Familia Barrera",
  description: "Tabla de posiciones del Mundial 2026 para la Familia Barrera",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="field-bg min-h-screen">{children}</body>
    </html>
  );
}
