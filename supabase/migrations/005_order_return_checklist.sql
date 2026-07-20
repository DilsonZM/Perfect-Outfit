-- ============================================================
-- Migración 005 — Recepción de órdenes: checklist, multas y comentarios
-- ============================================================

-- Órdenes: notas de entrega y recepción, fecha real de devolución
alter table public.service_orders
  add column if not exists delivery_notes text,
  add column if not exists return_notes text,
  add column if not exists return_received_at timestamptz;

-- Ítems de orden: control de devolución por prenda
alter table public.order_items
  add column if not exists returned_ok boolean default null,
  add column if not exists fine_amount numeric(12,2) not null default 0 check (fine_amount >= 0);
