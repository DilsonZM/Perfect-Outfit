-- ============================================================
-- Migración 006 — Estado 'extraviado' para prendas no devueltas
-- ============================================================

alter table public.inventory drop constraint if exists inventory_status_check;

alter table public.inventory add constraint inventory_status_check
  check (status in ('disponible', 'alquilado', 'lavanderia', 'mantenimiento', 'extraviado'));
