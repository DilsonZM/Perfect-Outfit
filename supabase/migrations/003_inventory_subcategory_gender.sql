-- ============================================================
-- Migración 003 — Jerarquía de catálogo en inventory
-- category (grupo) + subcategory (Smoking, Frac, Corbata...) + gender
-- ============================================================

alter table public.inventory add column if not exists subcategory text;
alter table public.inventory add column if not exists gender text;

alter table public.inventory drop constraint if exists inventory_gender_check;
alter table public.inventory add constraint inventory_gender_check
  check (gender in ('hombre', 'mujer', 'niño', 'unisex'));
