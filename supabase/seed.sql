-- ============================================================
-- Datos de prueba (SOLO desarrollo)
-- Ejecutar: node scripts/db-run.mjs supabase/seed.sql
-- Idempotente. Reinicia el inventario con el catálogo de gala.
-- ============================================================

begin;

-- Usuarios ---------------------------------------------------------------
-- ⚠️ Passwords en texto plano: SOLO desarrollo (ver migración 004)
insert into public.users (role, email, full_name, password) values
  ('admin',    'admin@perfectoutfit.co',    'Dilson Zapata (Admin)', 'admin123'),
  ('employee', 'empleada@perfectoutfit.co', 'Laura Torres',          'empleado123')
on conflict (email) do nothing;

-- Clientes ---------------------------------------------------------------
insert into public.clients (full_name, phone, email, document_id, address, birth_date, preferences) values
  ('Carlos Mendoza', '3001234567', 'carlos@mail.com',  '1020304050', 'Cra 45 #12-30, Medellín',  '1990-05-12', '{"talla":"M","pie":42,"colores":["negro","azul marino"]}'),
  ('Andrea Gómez',   '3019876543', 'andrea@mail.com',  '1030456070', 'Calle 10 #43-20, Medellín', '1995-11-03', '{"talla":"S","colores":["rojo","negro"]}'),
  ('Felipe Ríos',    '3005551122', 'felipe@mail.com',  '1010101010', 'Cl 80 #30-15, Bogotá',      '1988-02-25', '{"talla":"L","pie":44,"colores":["gris"]}')
on conflict (document_id) do nothing;

-- Inventario (catálogo de gala) -------------------------------------------
-- Se reinicia porque el seed anterior era genérico (dev only).
truncate public.inventory cascade;

insert into public.inventory (item_code, category, subcategory, gender, size, color, brand, base_price, replacement_cost, status) values
  -- Trajes y conjuntos principales
  ('SMO-001', 'Trajes y conjuntos', 'Smoking',            'hombre', 'M',         'Negro',          'Arrow',    180000,  950000, 'disponible'),
  ('SMO-002', 'Trajes y conjuntos', 'Smoking',            'hombre', 'L',         'Azul medianoche','Zara',     185000,  980000, 'disponible'),
  ('FRA-001', 'Trajes y conjuntos', 'Frac',               'hombre', 'M',         'Negro',          'Genérico', 250000, 1500000, 'disponible'),
  ('CHA-001', 'Trajes y conjuntos', 'Chaqué',             'hombre', 'L',         'Gris perla',     'Genérico', 220000, 1300000, 'disponible'),
  ('TRS-001', 'Trajes y conjuntos', 'Traje sastre',       'hombre', 'M',         'Azul',           'Arrow',    150000,  800000, 'disponible'),
  ('TRS-002', 'Trajes y conjuntos', 'Traje sastre',       'hombre', 'L',         'Gris',           'Zara',     145000,  780000, 'lavanderia'),
  ('TRS-003', 'Trajes y conjuntos', 'Traje sastre',       'hombre', 'S',         'Negro',          'H&M',      140000,  750000, 'disponible'),
  ('TRS-004', 'Trajes y conjuntos', 'Traje sastre',       'hombre', 'XL',        'Beige',          'Zara',     148000,  790000, 'disponible'),
  ('PAJ-001', 'Trajes y conjuntos', 'Traje pajecito',     'niño',   '8',         'Negro',          'Genérico',  80000,  400000, 'disponible'),
  ('PAJ-002', 'Trajes y conjuntos', 'Traje pajecito',     'niño',   '10',        'Azul',           'Genérico',  82000,  420000, 'disponible'),
  ('ROP-001', 'Trajes y conjuntos', 'Ropón de bautizo',   'niño',   '6-12 meses','Blanco',         'Genérico',  70000,  350000, 'disponible'),
  ('VNO-001', 'Trajes y conjuntos', 'Vestido de novia',   'mujer',  'S',         'Blanco',         'Genérico', 400000, 2500000, 'disponible'),
  ('VNO-002', 'Trajes y conjuntos', 'Vestido de novia',   'mujer',  'M',         'Marfil',         'Genérico', 420000, 2600000, 'alquilado'),
  ('VGA-001', 'Trajes y conjuntos', 'Vestido de gala',    'mujer',  'S',         'Rojo',           'Mango',    160000,  850000, 'disponible'),
  ('VGA-002', 'Trajes y conjuntos', 'Vestido de cóctel',  'mujer',  'M',         'Negro',          'Zara',     120000,  600000, 'disponible'),
  ('VQU-001', 'Trajes y conjuntos', 'Vestido de quinceañera','mujer','S',        'Rosa',           'Genérico', 300000, 1800000, 'disponible'),
  ('VPC-001', 'Trajes y conjuntos', 'Vestido de primera comunión','niño','10',   'Blanco',         'Genérico',  90000,  450000, 'disponible'),
  ('FAL-001', 'Trajes y conjuntos', 'Falda larga formal', 'mujer',  'M',         'Negro',          'H&M',       60000,  300000, 'disponible'),
  -- Calzado
  ('ZCH-001', 'Calzado', 'Zapatos de charol',             'hombre', '42',        'Negro',          'Bosi',      65000,  380000, 'disponible'),
  ('ZOX-001', 'Calzado', 'Zapatos Oxford',                'hombre', '40',        'Café',           'Bosi',      60000,  350000, 'disponible'),
  ('ZOX-002', 'Calzado', 'Zapatos Derby',                 'hombre', '44',        'Negro',          'Bosi',      58000,  340000, 'disponible'),
  ('ZTA-001', 'Calzado', 'Zapatos de tacón',              'mujer',  '37',        'Nude',           'Vizzano',   55000,  320000, 'disponible'),
  ('ZTA-002', 'Calzado', 'Plataformas',                   'mujer',  '36',        'Plateado',       'Vizzano',   58000,  330000, 'disponible'),
  ('ZNI-001', 'Calzado', 'Zapatos de ceremonia niño',     'niño',   '28',        'Blanco',         'Genérico',  35000,  180000, 'disponible'),
  -- Accesorios de cuello y torso
  ('COR-001', 'Accesorios de cuello y torso', 'Corbata slim',    'hombre', 'Única', 'Vino tinto',  'Zara',      15000,   80000, 'disponible'),
  ('COR-002', 'Accesorios de cuello y torso', 'Corbata clásica', 'hombre', 'Única', 'Azul',        'Arrow',     15000,   80000, 'disponible'),
  ('CBT-001', 'Accesorios de cuello y torso', 'Corbatín',        'hombre', 'Única', 'Negro',       'Genérico',  12000,   60000, 'disponible'),
  ('CBT-002', 'Accesorios de cuello y torso', 'Corbatín',        'hombre', 'Única', 'Burdeos',     'Genérico',  12000,   60000, 'disponible'),
  ('PLA-001', 'Accesorios de cuello y torso', 'Plastrón',        'hombre', 'Única', 'Plata',       'Genérico',  20000,  100000, 'disponible'),
  ('CHL-001', 'Accesorios de cuello y torso', 'Chaleco',         'hombre', 'M',     'Gris',        'Zara',      35000,  180000, 'disponible'),
  ('FAJ-001', 'Accesorios de cuello y torso', 'Faja (cummerbund)','hombre','Única', 'Negro',       'Genérico',  18000,   90000, 'disponible'),
  ('TIR-001', 'Accesorios de cuello y torso', 'Tirantes',        'unisex', 'Única', 'Negro',       'Genérico',  14000,   70000, 'disponible'),
  -- Joyería y complementos menores
  ('GEM-001', 'Joyería y complementos', 'Gemelos',              'unisex', 'Única', 'Plateado',     'Genérico',  12000,   60000, 'disponible'),
  ('PIS-001', 'Joyería y complementos', 'Pisacorbata',          'unisex', 'Única', 'Dorado',       'Genérico',   8000,   40000, 'disponible'),
  ('PAN-001', 'Joyería y complementos', 'Pañuelo de bolsillo',  'unisex', 'Única', 'Blanco',       'Genérico',   8000,   35000, 'disponible'),
  ('TIA-001', 'Joyería y complementos', 'Tiara',                'mujer',  'Única', 'Plateado con pedrería','Genérico', 45000, 250000, 'disponible'),
  ('TOC-001', 'Joyería y complementos', 'Tocado floral',        'mujer',  'Única', 'Blanco',       'Genérico',  30000,  150000, 'disponible'),
  -- Complementos prácticos
  ('CAM-001', 'Complementos prácticos', 'Camisa formal puño francés', 'hombre', 'M',  'Blanco',    'Arrow',     30000,  150000, 'disponible'),
  ('CAM-002', 'Complementos prácticos', 'Camisa formal cuello paloma','hombre', 'L',  'Blanco',    'Arrow',     28000,  140000, 'disponible'),
  ('CAN-001', 'Complementos prácticos', 'Can can (crinolina)',  'mujer',  'S',         'Blanco',    'Genérico',  25000,  120000, 'disponible'),
  ('VEL-001', 'Complementos prácticos', 'Velo catedral',        'mujer',  '3 m',       'Marfil',    'Genérico',  50000,  280000, 'disponible'),
  ('EST-001', 'Complementos prácticos', 'Estola',               'mujer',  'Única',     'Blanco',    'Genérico',  35000,  170000, 'mantenimiento'),
  ('CIN-001', 'Complementos prácticos', 'Cinturón formal',      'hombre', '34',        'Negro',     'Bosi',      10000,   50000, 'disponible');

commit;
