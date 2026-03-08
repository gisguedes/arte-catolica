-- Asegurar que avatar soporte strings largos (base64)
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/users_avatar_text.sql
ALTER TABLE users ALTER COLUMN avatar TYPE text USING avatar::text;
