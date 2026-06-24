-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Esquema de la base de datos para las apuestas (Mundial Familia Barrera) ║
-- ║  Cópialo y pégalo en Supabase → SQL Editor → Run.                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Usuarios (login con nombre + PIN). El PIN se guarda hasheado, nunca en texto.
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  pin_hash   text not null,
  balance    integer not null default 1000,   -- saldo inicial de monedas ficticias
  created_at timestamptz not null default now()
);

-- Apuestas. Una por usuario y partido (restricción única).
create table if not exists public.bets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  match_id    bigint not null,
  prediction  text not null check (prediction in ('HOME','DRAW','AWAY')),
  amount      integer not null check (amount > 0),
  status      text not null default 'PENDING' check (status in ('PENDING','WON','LOST')),
  payout      integer not null default 0,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (user_id, match_id)
);

create index if not exists bets_user_idx   on public.bets(user_id);
create index if not exists bets_status_idx on public.bets(status);

-- Selecciones de equipos para participantes registrados desde la UI.
-- Los del participants.json no necesitan esta tabla (están hardcodeados).
-- Un usuario no puede escoger el mismo equipo dos veces (restricción única).
create table if not exists public.user_teams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  team_name  text not null,
  created_at timestamptz not null default now(),
  unique (user_id, team_name)
);

create index if not exists user_teams_user_idx on public.user_teams(user_id);

-- Seguridad: activamos RLS sin políticas, así NADIE puede leer/escribir con la
-- clave pública (anon). La app accede solo desde el servidor con la service_role
-- key, que ignora RLS. Esto mantiene los datos protegidos.
-- Historial de transferencias entre participantes.
create table if not exists public.transfers (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references public.users(id) on delete cascade,
  to_user_id    uuid not null references public.users(id) on delete cascade,
  amount        integer not null check (amount > 0),
  created_at    timestamptz not null default now()
);

create index if not exists transfers_from_idx on public.transfers(from_user_id);
create index if not exists transfers_to_idx   on public.transfers(to_user_id);

alter table public.users      enable row level security;
alter table public.bets       enable row level security;
alter table public.user_teams enable row level security;
alter table public.transfers  enable row level security;
