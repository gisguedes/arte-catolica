-- Tabla para tokens de restablecimiento de contraseña
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/password_reset_tokens.sql

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT uuid_generate_v4(),
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);
