-- ============================================================
-- Migración 004 — Password para login básico (SOLO DESARROLLO)
-- ⚠️ Texto plano únicamente para el MVP. Antes de producción:
--    migrar a Supabase Auth y eliminar esta columna.
-- ============================================================

alter table public.users add column if not exists password text;

update public.users set password = 'admin123'
  where email = 'admin@perfectoutfit.co' and password is null;

update public.users set password = 'empleado123'
  where email = 'empleada@perfectoutfit.co' and password is null;
