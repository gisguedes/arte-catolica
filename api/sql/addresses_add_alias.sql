-- Migración: alias y phone en addresses (direcciones de entrega del comprador).
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/addresses_add_alias.sql
--
-- - alias: identificador de la dirección (ej: "Casa", "Oficina")
-- - phone: teléfono para cada dirección, para facilitar al repartidor

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS alias text;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN addresses.alias IS 'Alias de la dirección (ej: Casa, Oficina) para identificar direcciones del comprador';
COMMENT ON COLUMN addresses.phone IS 'Teléfono de contacto en esta dirección de entrega (repartidor)';
