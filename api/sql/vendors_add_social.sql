-- Migración: añadir social_links (JSONB) a vendors para redes sociales genéricas.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_add_social.sql
--
-- Estructura: [{"network": "instagram", "url": "https://..."}, {"network": "tiktok", "url": "..."}]
-- Permite añadir cualquier red social sin cambios de esquema.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Eliminar columnas específicas si existían (migración anterior)
ALTER TABLE vendors DROP COLUMN IF EXISTS instagram;
ALTER TABLE vendors DROP COLUMN IF EXISTS tiktok;

COMMENT ON COLUMN vendors.social_links IS 'Array de {network, url} para redes sociales (instagram, tiktok, facebook, etc.)';
