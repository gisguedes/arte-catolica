-- Migración: eliminar teléfono de users (el teléfono va en cada dirección de entrega).
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/users_remove_phone.sql
--
-- Tanto compradores como usuarios del vendedor tienen teléfono en cada dirección (addresses, vendor_addresses).

ALTER TABLE users DROP COLUMN IF EXISTS phone;
