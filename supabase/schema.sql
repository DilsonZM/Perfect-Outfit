-- ============================================================
-- Perfect Outfit — Esquema inicial (MVP Fase 1)
-- Sistema de Gestión para Tienda de Alquiler de Ropa
--
-- Ejecución:
--   node scripts/db-run.mjs supabase/schema.sql
--   (o pegar directamente en el SQL Editor de Supabase)
-- ============================================================

create extension if not exists "pgcrypto"; -- habilita gen_random_uuid()

-- ------------------------------------------------------------
-- 1. USERS — perfiles de usuario del sistema (admin / employee)
-- ------------------------------------------------------------
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  role       text not null default 'employee'
             check (role in ('admin', 'employee')),
  email      text not null unique,
  full_name  text not null,
  -- ⚠️ SOLO DESARROLLO: password en texto plano para el login básico del MVP.
  --    Antes de producción: migrar a Supabase Auth y eliminar esta columna.
  password   text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. INVENTORY — catálogo de prendas e ítems de alquiler
-- ------------------------------------------------------------
create table if not exists public.inventory (
  id               uuid primary key default gen_random_uuid(),
  item_code        text not null unique,          -- código interno, ej. SMO-001
  category         text not null,                 -- grupo: Trajes y conjuntos, Calzado, Accesorios...
  subcategory      text,                          -- ej. Smoking, Frac, Vestido de novia, Corbata
  gender           text check (gender in ('hombre', 'mujer', 'niño', 'unisex')),
  size             text,                          -- ej. S, M, L, 42
  color            text,
  brand            text,
  base_price       numeric(12,2) not null default 0 check (base_price >= 0),
  replacement_cost numeric(12,2) not null default 0 check (replacement_cost >= 0),
  status           text not null default 'disponible'
                   check (status in ('disponible', 'alquilado', 'lavanderia', 'mantenimiento')),
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. CLIENTS — CRM de clientes
-- ------------------------------------------------------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  email       text,
  document_id text unique,                        -- cédula / documento de identidad
  address     text,
  birth_date  date,                               -- para calcular la edad
  preferences jsonb not null default '{}'::jsonb, -- ej. {"talla":"M","colores":["negro","azul"]}
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. SERVICE_ORDERS — órdenes de alquiler (core del negocio)
-- ------------------------------------------------------------
create table if not exists public.service_orders (
  id             uuid primary key default gen_random_uuid(),
  folio          bigint generated always as identity unique, -- folio visible: PO-000001
  client_id      uuid not null references public.clients(id) on delete restrict,
  employee_id    uuid references public.users(id) on delete set null,
  total_amount   numeric(12,2) not null default 0 check (total_amount >= 0),
  discount       numeric(12,2) not null default 0 check (discount >= 0),
  payment_method text,                            -- ej. efectivo, tarjeta, transferencia
  status         text not null default 'activa'
                 check (status in ('activa', 'atrasada', 'completada', 'cancelada')),
  delivery_date  timestamptz,
  return_date    timestamptz,
  delivery_notes text,                            -- observaciones de entrega
  return_notes   text,                            -- observaciones de devolución
  return_received_at timestamptz,                 -- fecha real de recepción
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. ORDER_ITEMS — detalle de ítems por orden
-- ------------------------------------------------------------
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.service_orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory(id) on delete restrict,
  quantity          integer not null default 1 check (quantity > 0),
  item_type         text not null default 'prenda principal'
                    check (item_type in ('prenda principal', 'zapato', 'accesorio')),
  returned_ok       boolean,                      -- null=pendiente, true=ok, false=dañado
  fine_amount       numeric(12,2) not null default 0 check (fine_amount >= 0)
);

-- ------------------------------------------------------------
-- ÍNDICES (llaves foráneas y consultas frecuentes)
-- ------------------------------------------------------------
create index if not exists idx_inventory_status       on public.inventory(status);
create index if not exists idx_orders_client          on public.service_orders(client_id);
create index if not exists idx_orders_employee        on public.service_orders(employee_id);
create index if not exists idx_orders_return_date     on public.service_orders(return_date);
create index if not exists idx_order_items_order      on public.order_items(order_id);
create index if not exists idx_order_items_inventory  on public.order_items(inventory_item_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ⚠️ DESARROLLO: acceso público total (anon + authenticated).
--    Antes de producción: reemplazar por políticas por rol.
-- ------------------------------------------------------------
alter table public.users          enable row level security;
alter table public.inventory      enable row level security;
alter table public.clients        enable row level security;
alter table public.service_orders enable row level security;
alter table public.order_items    enable row level security;

drop policy if exists "dev_public_all" on public.users;
create policy "dev_public_all" on public.users
  for all using (true) with check (true);

drop policy if exists "dev_public_all" on public.inventory;
create policy "dev_public_all" on public.inventory
  for all using (true) with check (true);

drop policy if exists "dev_public_all" on public.clients;
create policy "dev_public_all" on public.clients
  for all using (true) with check (true);

drop policy if exists "dev_public_all" on public.service_orders;
create policy "dev_public_all" on public.service_orders
  for all using (true) with check (true);

drop policy if exists "dev_public_all" on public.order_items;
create policy "dev_public_all" on public.order_items
  for all using (true) with check (true);
