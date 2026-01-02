export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category_id: number;
  artist_id: number;
  category?: Category;
  artist?: Artist;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Artist {
  id: number;
  name: string;
  bio?: string;
  image?: string;
  email?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

