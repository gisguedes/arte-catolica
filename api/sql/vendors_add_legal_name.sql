-- Migración: añadir razón social / nombre fiscal (privado, para facturas y uso administrativo).
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_add_legal_name.sql

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_name text;

COMMENT ON COLUMN vendors.legal_name IS 'Razón social / nombre fiscal de la empresa. Privado, no se muestra en la página del artista.';
