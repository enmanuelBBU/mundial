# ⚽ Mundial 2026 · Familia Barrera

Aplicación web para seguir la tabla de posiciones del Mundial 2026 entre los miembros de la familia Barrera. Cada participante tiene 3 equipos asignados y suma puntos según el desempeño real de esos equipos: **ganar = 3 pts**, **empatar = 1 pt**, **perder = 0 pts**.

Los resultados se obtienen en tiempo real desde la API de [football-data.org](https://www.football-data.org/) y los puntos se recalculan dinámicamente.

## Stack

- **Next.js 15** (App Router, Server Components)
- **React 19**
- **Tailwind CSS 3**
- **TypeScript**

## Cómo correrlo en local

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Crea tu archivo de entorno a partir del ejemplo y pon tu API key:
   ```bash
   cp .env.example .env.local
   ```
   Consigue una API key gratis en https://www.football-data.org/client/register
   y pégala en `.env.local`:
   ```
   FOOTBALL_API_KEY=tu_api_key
   ```
   > Sin API key la app arranca igual en **modo demo** con datos simulados.

3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000

## Estructura

```
src/
├── app/
│   ├── api/standings/route.ts   Endpoint que calcula el ranking
│   ├── page.tsx                 Página principal
│   ├── layout.tsx
│   └── globals.css
├── components/                  Header, RankingTable, TeamBadge, RefreshButton
├── data/participants.json       Participantes y sus equipos
├── lib/
│   ├── football.ts              Cliente de la API + caché + lógica de puntos
│   ├── teamMapping.ts           Nombres ES→EN y banderas
│   └── fixServerStorage.ts      Parche para localStorage de Node 25 en SSR
└── instrumentation.ts
```

## Cómo se calculan los puntos

`src/lib/football.ts` recorre todos los partidos finalizados del torneo y cuenta
victorias/empates/derrotas por equipo (`puntos = victorias×3 + empates×1`).
`src/app/page.tsx` es un Server Component con `dynamic = "force-dynamic"`, así que
recalcula en cada carga. El botón **Actualizar resultados** llama a `router.refresh()`
para volver a consultar la API sin recargar la página entera.

## Nota técnica (Node 25)

Node v25 expone un `localStorage` roto del lado del servidor que rompe el SSR de
Next.js. `src/lib/fixServerStorage.ts` lo reemplaza por una implementación en
memoria. Si usas Node 20/22 LTS no necesitas preocuparte por esto.
