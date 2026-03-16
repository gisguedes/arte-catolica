-- Tabla vendor_bank_accounts: cuentas bancarias del vendedor para recibir pagos.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_bank_accounts.sql

CREATE TABLE IF NOT EXISTS vendor_bank_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_holder_name text NOT NULL,
  iban text NOT NULL,
  swift_bic text,
  bank_name text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_bank_accounts_vendor_id ON vendor_bank_accounts(vendor_id);

COMMENT ON TABLE vendor_bank_accounts IS 'Cuentas bancarias del vendedor para facturación/pagos.';
COMMENT ON COLUMN vendor_bank_accounts.iban IS 'IBAN completo (ej. ES9121000418450200051332)';
COMMENT ON COLUMN vendor_bank_accounts.is_default IS 'Si true, se usará por defecto para pagos cuando haya varias cuentas';
COMMENT ON COLUMN vendor_bank_accounts.is_active IS 'Si false, cuenta desactivada por el usuario; se conserva para historial y no se muestra en el perfil.';
