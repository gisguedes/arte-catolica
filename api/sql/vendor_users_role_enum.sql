-- Migración: enum vendor_user_role para evitar errores de digitación en roles.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_users_role_enum.sql

-- Crear tipo enum con los roles permitidos
DO $$ BEGIN
  CREATE TYPE vendor_user_role AS ENUM ('owner', 'admin', 'finanzas', 'logistica', 'comercial');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- ya existe
END $$;

-- Quitar el default (PostgreSQL no puede castear default text→enum automáticamente)
ALTER TABLE vendor_users ALTER COLUMN role DROP DEFAULT;

-- Cambiar columna role de text a enum (convierte valores existentes)
ALTER TABLE vendor_users
  ALTER COLUMN role TYPE vendor_user_role USING role::vendor_user_role;

-- Restaurar el default
ALTER TABLE vendor_users ALTER COLUMN role SET DEFAULT 'owner'::vendor_user_role;

COMMENT ON TYPE vendor_user_role IS 'Roles de usuario en un vendor: owner, admin, finanzas, logistica, comercial';
