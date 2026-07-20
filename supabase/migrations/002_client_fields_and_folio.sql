-- ============================================================
-- Migración 002 — Campos de cliente + folio consecutivo de orden
-- ============================================================

-- Clientes: dirección y fecha de nacimiento (para mostrar edad)
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists birth_date date;

-- Órdenes: folio consecutivo visible (PO-000001, PO-000002, ...)
alter table public.service_orders
  add column if not exists folio bigint generated always as identity;

create unique index if not exists idx_service_orders_folio
  on public.service_orders(folio);
