export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  is_featured?: boolean;
  artist_id?: string;
  vendor_id?: string;
  category?: Category;
  categories?: Category[];
  artist?: Artist;
  vendor?: Artist;
  stock?: number;
  availability?: string;
  height_cm?: number;
  width_cm?: number;
  depth_cm?: number;
  materials?: Material[];
  colors?: ColorOption[];
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image?: string;
  email?: string;
  website?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  opening_date?: string;
  artist_types?: ArtistType[];
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductImage {
  id: string;
  image_path: string;
  order?: number;
  is_primary?: boolean;
}

export interface Material {
  id: string;
  slug: string;
  name: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ArtistType {
  id: string;
  slug: string;
  name: string;
}

