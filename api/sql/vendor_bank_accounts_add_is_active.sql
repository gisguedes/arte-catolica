-- Añadir is_active para soft delete: las cuentas "eliminadas" se marcan inactivas y se mantienen para historial.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_bank_accounts_add_is_active.sql

ALTER TABLE vendor_bank_accounts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN vendor_bank_accounts.is_active IS 'Si false, la cuenta está desactivada (eliminada por el usuario) pero se conserva para registros. No se muestra en el perfil.';
