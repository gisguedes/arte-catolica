CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  surname text,
  email text,
  phone text,
  nif text,
  bio text,
  image text,
  website text,
  city text,
  country text,
  postal_code text,
  opening_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_types (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_type_vendor (
  artist_type_id uuid REFERENCES artist_types(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (artist_type_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL,
  stock integer DEFAULT 0,
  availability text DEFAULT 'in_stock',
  height_cm numeric(8,2),
  width_cm numeric(8,2),
  depth_cm numeric(8,2),
  sku text UNIQUE,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_translations (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, locale)
);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  "order" integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_translations (
  id uuid PRIMARY KEY,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (category_id, locale)
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material_translations (
  id uuid PRIMARY KEY,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (material_id, locale)
);

CREATE TABLE IF NOT EXISTS colors (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  hex text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_product (
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (category_id, product_id)
);

CREATE TABLE IF NOT EXISTS material_product (
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (material_id, product_id)
);

CREATE TABLE IF NOT EXISTS color_product (
  color_id uuid REFERENCES colors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (color_id, product_id)
);

