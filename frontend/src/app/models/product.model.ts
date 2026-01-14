export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  artist_id: string;
  category?: Category;
  categories?: Category[];
  artist?: Artist;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

