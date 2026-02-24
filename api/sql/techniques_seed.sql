-- Seed de técnicas de producto
-- Uso: psql "$DATABASE_URL" -f api/sql/techniques_seed.sql
-- Ejecutar DESPUÉS de techniques_schema.sql

BEGIN;

DELETE FROM product_technique;
DELETE FROM technique_translations;
DELETE FROM techniques;

INSERT INTO techniques (id, alias, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'tallado-mano', NOW(), NOW()),
  (uuid_generate_v4(), 'modelado', NOW(), NOW()),
  (uuid_generate_v4(), 'fundicion', NOW(), NOW()),
  (uuid_generate_v4(), 'relieve', NOW(), NOW()),
  (uuid_generate_v4(), 'policromado', NOW(), NOW()),
  (uuid_generate_v4(), 'dorado-pan-oro', NOW(), NOW()),
  (uuid_generate_v4(), 'ensamblado-artesanal', NOW(), NOW()),
  (uuid_generate_v4(), 'escultura-piedra', NOW(), NOW()),
  (uuid_generate_v4(), 'oleo-lienzo', NOW(), NOW()),
  (uuid_generate_v4(), 'acrilico', NOW(), NOW()),
  (uuid_generate_v4(), 'temple-huevo', NOW(), NOW()),
  (uuid_generate_v4(), 'tecnica-mixta', NOW(), NOW()),
  (uuid_generate_v4(), 'iconografia-tradicional', NOW(), NOW()),
  (uuid_generate_v4(), 'dorado-agua', NOW(), NOW()),
  (uuid_generate_v4(), 'dorado-mixion', NOW(), NOW()),
  (uuid_generate_v4(), 'grabado-manual', NOW(), NOW()),
  (uuid_generate_v4(), 'serigrafia', NOW(), NOW()),
  (uuid_generate_v4(), 'impresion-giclee', NOW(), NOW()),
  (uuid_generate_v4(), 'pintura-digital', NOW(), NOW()),
  (uuid_generate_v4(), 'orfebreria-artesanal', NOW(), NOW()),
  (uuid_generate_v4(), 'fundicion-metal', NOW(), NOW()),
  (uuid_generate_v4(), 'grabado-mano', NOW(), NOW()),
  (uuid_generate_v4(), 'engaste-manual', NOW(), NOW()),
  (uuid_generate_v4(), 'macrame', NOW(), NOW()),
  (uuid_generate_v4(), 'filigrana', NOW(), NOW()),
  (uuid_generate_v4(), 'bordado-mano', NOW(), NOW()),
  (uuid_generate_v4(), 'bordado-hilo-dorado', NOW(), NOW()),
  (uuid_generate_v4(), 'tejido-artesanal', NOW(), NOW()),
  (uuid_generate_v4(), 'aplicacion-textil', NOW(), NOW()),
  (uuid_generate_v4(), 'restauracion-tradicional', NOW(), NOW()),
  (uuid_generate_v4(), 'grabado', NOW(), NOW()),
  (uuid_generate_v4(), 'litografia', NOW(), NOW()),
  (uuid_generate_v4(), 'impresion-artistica', NOW(), NOW()),
  (uuid_generate_v4(), 'edicion-limitada', NOW(), NOW()),
  (uuid_generate_v4(), 'numerado-firmado', NOW(), NOW());

-- Traducciones español
INSERT INTO technique_translations (id, technique_id, locale, name, slug, description)
SELECT uuid_generate_v4(), t.id, 'es', v.name_es, v.slug_es, v.desc_es
FROM techniques t
JOIN (VALUES
  ('tallado-mano', 'Tallado a mano', 'tallado-mano', 'Escultura mediante talla directa en el material.'),
  ('modelado', 'Modelado', 'modelado', 'Técnica de modelado en barro, cera o materiales moldeables.'),
  ('fundicion', 'Fundición', 'fundicion', 'Proceso de fundición en bronce u otros metales.'),
  ('relieve', 'Relieve', 'relieve', 'Escultura en relieve, tallada en un plano.'),
  ('policromado', 'Policromado', 'policromado', 'Pintura policromada sobre escultura.'),
  ('dorado-pan-oro', 'Dorado con pan de oro', 'dorado-pan-oro', 'Aplicación de láminas de oro sobre la superficie.'),
  ('ensamblado-artesanal', 'Ensamblado artesanal', 'ensamblado-artesanal', 'Ensamblaje manual de piezas.'),
  ('escultura-piedra', 'Escultura en piedra', 'escultura-piedra', 'Tallado directo en piedra.'),
  ('oleo-lienzo', 'Óleo sobre lienzo', 'oleo-lienzo', 'Pintura al óleo sobre lienzo.'),
  ('acrilico', 'Acrílico', 'acrilico', 'Pintura acrílica.'),
  ('temple-huevo', 'Temple al huevo', 'temple-huevo', 'Técnica tradicional de pintura al temple con huevo.'),
  ('tecnica-mixta', 'Técnica mixta', 'tecnica-mixta', 'Combinación de varias técnicas pictóricas.'),
  ('iconografia-tradicional', 'Iconografía tradicional', 'iconografia-tradicional', 'Pintura de iconos según tradición bizantina u oriental.'),
  ('dorado-agua', 'Dorado al agua', 'dorado-agua', 'Técnica de dorado con cola de conejo.'),
  ('dorado-mixion', 'Dorado al mixtión', 'dorado-mixion', 'Dorado con base oleosa (mixtión).'),
  ('grabado-manual', 'Grabado manual', 'grabado-manual', 'Grabado a mano sobre plancha.'),
  ('serigrafia', 'Serigrafía', 'serigrafia', 'Impresión por serigrafía.'),
  ('impresion-giclee', 'Impresión Giclée', 'impresion-giclee', 'Impresión de alta calidad con tintas pigmentadas.'),
  ('pintura-digital', 'Pintura digital', 'pintura-digital', 'Obra creada o reproducida digitalmente.'),
  ('orfebreria-artesanal', 'Orfebrería artesanal', 'orfebreria-artesanal', 'Trabajo manual en metal precioso.'),
  ('fundicion-metal', 'Fundición en metal', 'fundicion-metal', 'Fundición artesanal en metal.'),
  ('grabado-mano', 'Grabado a mano', 'grabado-mano', 'Grabado manual sobre metal u otro soporte.'),
  ('engaste-manual', 'Engaste manual', 'engaste-manual', 'Engaste de piedras a mano.'),
  ('macrame', 'Macramé', 'macrame', 'Técnica de anudado manual.'),
  ('filigrana', 'Filigrana', 'filigrana', 'Trabajo en hilos finos de metal.'),
  ('bordado-mano', 'Bordado a mano', 'bordado-mano', 'Bordado realizado a mano.'),
  ('bordado-hilo-dorado', 'Bordado en hilo dorado', 'bordado-hilo-dorado', 'Bordado con hilos metálicos dorados.'),
  ('tejido-artesanal', 'Tejido artesanal', 'tejido-artesanal', 'Tejido realizado a mano.'),
  ('aplicacion-textil', 'Aplicación textil', 'aplicacion-textil', 'Aplicación de telas o piezas sobre soporte textil.'),
  ('restauracion-tradicional', 'Restauración tradicional', 'restauracion-tradicional', 'Restauración con técnicas tradicionales.'),
  ('grabado', 'Grabado', 'grabado', 'Técnica de grabado sobre plancha.'),
  ('litografia', 'Litografía', 'litografia', 'Impresión litográfica.'),
  ('impresion-artistica', 'Impresión artística', 'impresion-artistica', 'Impresión de obra de arte.'),
  ('edicion-limitada', 'Edición limitada', 'edicion-limitada', 'Tirada limitada y numerada.'),
  ('numerado-firmado', 'Numerado y firmado', 'numerado-firmado', 'Ejemplar numerado y firmado por el artista.')
) AS v(alias, name_es, slug_es, desc_es) ON t.alias = v.alias;

-- Traducciones inglés
INSERT INTO technique_translations (id, technique_id, locale, name, slug, description)
SELECT uuid_generate_v4(), t.id, 'en', v.name_en, v.slug_en, v.desc_en
FROM techniques t
JOIN (VALUES
  ('tallado-mano', 'Hand carving', 'hand-carving', 'Sculpture through direct carving in the material.'),
  ('modelado', 'Modeling', 'modeling', 'Modeling in clay, wax or moldable materials.'),
  ('fundicion', 'Casting', 'casting', 'Bronze or other metal casting process.'),
  ('relieve', 'Relief', 'relief', 'Relief sculpture carved in a plane.'),
  ('policromado', 'Polychrome', 'polychrome', 'Polychrome painting on sculpture.'),
  ('dorado-pan-oro', 'Gold leaf gilding', 'gold-leaf-gilding', 'Application of gold leaf on the surface.'),
  ('ensamblado-artesanal', 'Handmade assembly', 'handmade-assembly', 'Hand assembly of pieces.'),
  ('escultura-piedra', 'Stone sculpture', 'stone-sculpture', 'Direct carving in stone.'),
  ('oleo-lienzo', 'Oil on canvas', 'oil-on-canvas', 'Oil painting on canvas.'),
  ('acrilico', 'Acrylic', 'acrylic', 'Acrylic painting.'),
  ('temple-huevo', 'Egg tempera', 'egg-tempera', 'Traditional egg tempera painting technique.'),
  ('tecnica-mixta', 'Mixed media', 'mixed-media', 'Combination of several painting techniques.'),
  ('iconografia-tradicional', 'Traditional iconography', 'traditional-iconography', 'Icon painting according to Byzantine or Eastern tradition.'),
  ('dorado-agua', 'Water gilding', 'water-gilding', 'Gilding technique with rabbit skin glue.'),
  ('dorado-mixion', 'Oil gilding', 'oil-gilding', 'Gilding with oil-based ground (mixtion).'),
  ('grabado-manual', 'Hand engraving', 'hand-engraving', 'Hand engraving on plate.'),
  ('serigrafia', 'Screen printing', 'screen-printing', 'Screen printing.'),
  ('impresion-giclee', 'Giclée print', 'giclee-print', 'High quality print with pigment inks.'),
  ('pintura-digital', 'Digital painting', 'digital-painting', 'Work created or reproduced digitally.'),
  ('orfebreria-artesanal', 'Handcrafted metalwork', 'handcrafted-metalwork', 'Hand work in precious metal.'),
  ('fundicion-metal', 'Metal casting', 'metal-casting', 'Handcrafted metal casting.'),
  ('grabado-mano', 'Hand engraving', 'hand-engraving-metal', 'Hand engraving on metal or jewelry.'),
  ('engaste-manual', 'Hand setting', 'hand-setting', 'Hand setting of stones.'),
  ('macrame', 'Macramé', 'macrame', 'Hand knotting technique.'),
  ('filigrana', 'Filigree', 'filigree', 'Work in fine metal threads.'),
  ('bordado-mano', 'Hand embroidery', 'hand-embroidery', 'Hand embroidery.'),
  ('bordado-hilo-dorado', 'Gold thread embroidery', 'gold-thread-embroidery', 'Embroidery with metallic gold threads.'),
  ('tejido-artesanal', 'Hand weaving', 'hand-weaving', 'Hand weaving.'),
  ('aplicacion-textil', 'Textile application', 'textile-application', 'Application of fabrics or pieces on textile support.'),
  ('restauracion-tradicional', 'Traditional restoration', 'traditional-restoration', 'Restoration with traditional techniques.'),
  ('grabado', 'Engraving', 'engraving', 'Engraving technique on plate.'),
  ('litografia', 'Lithography', 'lithography', 'Lithographic printing.'),
  ('impresion-artistica', 'Fine art print', 'fine-art-print', 'Art print.'),
  ('edicion-limitada', 'Limited edition', 'limited-edition', 'Limited and numbered edition.'),
  ('numerado-firmado', 'Numbered and signed', 'numbered-and-signed', 'Numbered and signed by the artist.')
) AS v(alias, name_en, slug_en, desc_en) ON t.alias = v.alias;

COMMIT;
