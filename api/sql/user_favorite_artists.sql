-- Tabla user_favorite_artists: favoritos de artistas (vendors)
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/user_favorite_artists.sql

CREATE TABLE IF NOT EXISTS user_favorite_artists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS user_favorite_artists_user_id_idx ON user_favorite_artists(user_id);
CREATE INDEX IF NOT EXISTS user_favorite_artists_vendor_id_idx ON user_favorite_artists(vendor_id);
