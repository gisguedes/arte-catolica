-- Seed de características por material con traducciones (es/en).
-- material_characteristics: alias (identificador interno), sort_order
-- material_characteristic_translations: name y slug por locale
-- Ejecutar después de material_characteristics_migration.sql: psql "$DATABASE_URL" -f api/sql/material_characteristics_seed.sql

DELETE FROM material_characteristic_translations WHERE material_characteristic_id IN (
  SELECT id FROM material_characteristics WHERE material_id IN (
    SELECT id FROM materials WHERE alias IN (
      'madera', 'piedra', 'marmol', 'bronce', 'metal', 'plata', 'oro', 'pan-de-oro',
      'lienzo', 'papel', 'pergamino', 'vidrio', 'resina', 'textil', 'cuero'
    )
  )
);
DELETE FROM material_characteristics WHERE material_id IN (
  SELECT id FROM materials WHERE alias IN (
    'madera', 'piedra', 'marmol', 'bronce', 'metal', 'plata', 'oro', 'pan-de-oro',
    'lienzo', 'papel', 'pergamino', 'vidrio', 'resina', 'textil', 'cuero'
  )
);

-- Datos: material_alias, char_alias, sort_order, name_es, name_en
WITH data AS (
  SELECT * FROM (VALUES
    ('madera', 'natural', 0, 'Natural', 'Natural'),
    ('madera', 'barnizado', 1, 'Barnizado', 'Varnished'),
    ('madera', 'envejecido', 2, 'Envejecido', 'Aged'),
    ('madera', 'policromado', 3, 'Policromado', 'Polychromed'),
    ('madera', 'dorado', 4, 'Dorado', 'Gilded'),
    ('piedra', 'natural', 0, 'Natural', 'Natural'),
    ('piedra', 'pulido', 1, 'Pulido', 'Polished'),
    ('piedra', 'mate', 2, 'Mate', 'Matte'),
    ('piedra', 'tallado', 3, 'Tallado', 'Carved'),
    ('marmol', 'pulido', 0, 'Pulido', 'Polished'),
    ('marmol', 'mate', 1, 'Mate', 'Matte'),
    ('marmol', 'veteado-natural', 2, 'Veteado natural', 'Natural veining'),
    ('marmol', 'tallado', 3, 'Tallado', 'Carved'),
    ('bronce', 'patinado', 0, 'Patinado', 'Patinated'),
    ('bronce', 'pulido', 1, 'Pulido', 'Polished'),
    ('bronce', 'envejecido', 2, 'Envejecido', 'Aged'),
    ('bronce', 'fundido', 3, 'Fundido', 'Cast'),
    ('metal', 'pulido', 0, 'Pulido', 'Polished'),
    ('metal', 'mate', 1, 'Mate', 'Matte'),
    ('metal', 'envejecido', 2, 'Envejecido', 'Aged'),
    ('metal', 'grabado', 3, 'Grabado', 'Engraved'),
    ('plata', '925', 0, '925', '925'),
    ('plata', 'pulido', 1, 'Pulido', 'Polished'),
    ('plata', 'mate', 2, 'Mate', 'Matte'),
    ('plata', 'bano-de-oro', 3, 'Baño de oro', 'Gold plated'),
    ('plata', 'envejecido', 4, 'Envejecido', 'Aged'),
    ('oro', '18k', 0, '18k', '18k'),
    ('oro', '24k', 1, '24k', '24k'),
    ('oro', 'pulido', 2, 'Pulido', 'Polished'),
    ('oro', 'mate', 3, 'Mate', 'Matte'),
    ('pan-de-oro', 'aplicado-a-mano', 0, 'Aplicado a mano', 'Hand applied'),
    ('pan-de-oro', 'dorado-al-agua', 1, 'Dorado al agua', 'Water gilding'),
    ('pan-de-oro', 'dorado-al-mixtion', 2, 'Dorado al mixtión', 'Oil gilding'),
    ('pan-de-oro', 'acabado-brillante', 3, 'Acabado brillante', 'Glossy finish'),
    ('pan-de-oro', 'acabado-mate', 4, 'Acabado mate', 'Matte finish'),
    ('lienzo', 'montado-sobre-bastidor', 0, 'Montado sobre bastidor', 'Mounted on stretcher'),
    ('lienzo', 'sin-enmarcar', 1, 'Sin enmarcar', 'Unframed'),
    ('lienzo', 'enmarcado', 2, 'Enmarcado', 'Framed'),
    ('lienzo', 'texturizado', 3, 'Texturizado', 'Textured'),
    ('papel', 'papel-de-archivo', 0, 'Papel de archivo', 'Archival paper'),
    ('papel', 'texturizado', 1, 'Texturizado', 'Textured'),
    ('papel', 'algodon', 2, 'Algodón', 'Cotton'),
    ('papel', 'edicion-limitada', 3, 'Edición limitada', 'Limited edition'),
    ('papel', 'numerado', 4, 'Numerado', 'Numbered'),
    ('pergamino', 'natural', 0, 'Natural', 'Natural'),
    ('pergamino', 'tratado', 1, 'Tratado', 'Treated'),
    ('pergamino', 'iluminado', 2, 'Iluminado', 'Illuminated'),
    ('pergamino', 'envejecido', 3, 'Envejecido', 'Aged'),
    ('vidrio', 'transparente', 0, 'Transparente', 'Transparent'),
    ('vidrio', 'esmerilado', 1, 'Esmerilado', 'Frosted'),
    ('vidrio', 'coloreado', 2, 'Coloreado', 'Colored'),
    ('vidrio', 'pintado', 3, 'Pintado', 'Painted'),
    ('resina', 'acabado-mate', 0, 'Acabado mate', 'Matte finish'),
    ('resina', 'acabado-brillante', 1, 'Acabado brillante', 'Glossy finish'),
    ('resina', 'pintado', 2, 'Pintado', 'Painted'),
    ('resina', 'patinado', 3, 'Patinado', 'Patinated'),
    ('textil', 'bordado', 0, 'Bordado', 'Embroidered'),
    ('textil', 'hilo-dorado', 1, 'Hilo dorado', 'Gold thread'),
    ('textil', 'forrado', 2, 'Forrado', 'Lined'),
    ('textil', 'tejido-artesanal', 3, 'Tejido artesanal', 'Handwoven'),
    ('textil', 'estampado', 4, 'Estampado', 'Printed'),
    ('cuero', 'natural', 0, 'Natural', 'Natural'),
    ('cuero', 'curtido-vegetal', 1, 'Curtido vegetal', 'Vegetable tanned'),
    ('cuero', 'grabado', 2, 'Grabado', 'Engraved'),
    ('cuero', 'tenido', 3, 'Teñido', 'Dyed'),
    ('cuero', 'envejecido', 4, 'Envejecido', 'Aged')
  ) AS t(mat_alias, char_alias, sort_order, name_es, name_en)
),
ins AS (
  INSERT INTO material_characteristics (material_id, alias, sort_order)
  SELECT m.id, d.char_alias, d.sort_order
  FROM data d
  JOIN materials m ON m.alias = d.mat_alias
  RETURNING id, material_id, alias
)
INSERT INTO material_characteristic_translations (material_characteristic_id, locale, name, slug)
SELECT i.id, 'es', d.name_es, i.alias
FROM ins i
JOIN materials m ON m.id = i.material_id
JOIN data d ON d.mat_alias = m.alias AND d.char_alias = i.alias
UNION ALL
SELECT i.id, 'en', d.name_en, i.alias
FROM ins i
JOIN materials m ON m.id = i.material_id
JOIN data d ON d.mat_alias = m.alias AND d.char_alias = i.alias;
