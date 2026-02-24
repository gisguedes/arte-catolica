-- Seed de tipos de artista (6 tipos)
-- Uso: psql "$DATABASE_URL" -f api/sql/artist_types_seed.sql
-- Ejecutar DESPUÉS de artist_types_schema.sql
--
-- Tipos: Escultor, Pintor, Iconógrafo, Orfebre, Ilustrador, Artesano textil

BEGIN;

-- Eliminar traducciones y tipos existentes (mantener artist_type_vendor si quieres conservar relaciones)
DELETE FROM artist_type_translations;
DELETE FROM artist_type_vendor;
DELETE FROM artist_types;

INSERT INTO artist_types (id, alias, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'sculptor', NOW(), NOW()),
  (uuid_generate_v4(), 'painter', NOW(), NOW()),
  (uuid_generate_v4(), 'iconographer', NOW(), NOW()),
  (uuid_generate_v4(), 'goldsmith', NOW(), NOW()),
  (uuid_generate_v4(), 'illustrator', NOW(), NOW()),
  (uuid_generate_v4(), 'textile-artisan', NOW(), NOW());

-- Traducciones español
INSERT INTO artist_type_translations (id, artist_type_id, locale, name, slug, description)
SELECT uuid_generate_v4(), at.id, 'es', v.name_es, v.slug_es, v.desc_es
FROM artist_types at
JOIN (VALUES
  ('sculptor', 'Escultor', 'escultor', 'Artistas especializados en escultura y obras tridimensionales.'),
  ('painter', 'Pintor', 'pintor', 'Artistas que trabajan la pintura en sus distintas técnicas.'),
  ('iconographer', 'Iconógrafo', 'iconografo', 'Artistas dedicados a la iconografía y arte sacro de tradición oriental y occidental.'),
  ('goldsmith', 'Orfebre', 'orfebre', 'Artistas del metal, la plata y la orfebrería artística.'),
  ('illustrator', 'Ilustrador', 'ilustrador', 'Artistas que ilustran libros, grabados y arte impreso.'),
  ('textile-artisan', 'Artesano textil', 'artesano-textil', 'Artistas especializados en tejidos, vestimentas litúrgicas y arte textil.')
) AS v(alias, name_es, slug_es, desc_es) ON at.alias = v.alias;

-- Traducciones inglés
INSERT INTO artist_type_translations (id, artist_type_id, locale, name, slug, description)
SELECT uuid_generate_v4(), at.id, 'en', v.name_en, v.slug_en, v.desc_en
FROM artist_types at
JOIN (VALUES
  ('sculptor', 'Sculptor', 'sculptor', 'Artists specializing in sculpture and three-dimensional works.'),
  ('painter', 'Painter', 'painter', 'Artists working in painting across various techniques.'),
  ('iconographer', 'Iconographer', 'iconographer', 'Artists dedicated to iconography and sacred art.'),
  ('goldsmith', 'Goldsmith', 'goldsmith', 'Artists working with metal, silver and artistic metalwork.'),
  ('illustrator', 'Illustrator', 'illustrator', 'Artists who illustrate books, prints and printed art.'),
  ('textile-artisan', 'Textile artisan', 'textile-artisan', 'Artists specialized in textiles, liturgical vestments and textile art.')
) AS v(alias, name_en, slug_en, desc_en) ON at.alias = v.alias;

COMMIT;
