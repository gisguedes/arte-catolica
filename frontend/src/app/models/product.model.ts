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
  techniques?: Technique[];
  colors?: ColorOption[];
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface ShippingCalendar {
  origin_country?: string;
  origin_postal_code?: string;
  destination_country?: string;
  destination_postal_code?: string;
  destination_region?: string | null;
  ship_dates: string[];
  blocked_dates?: string[];
  default_ship_date?: string | null;
  transit_days_min: number;
  transit_days_max: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  /** Descripción larga con HTML para formatear (página de detalle) */
  content?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Artist {
  id: string;
  name: string;
  /** Descripción breve para la card de artistas/vendors */
  short_description?: string | null;
  /** Descripción larga para la página de detalle del artista */
  description?: string | null;
  image?: string;
  website?: string;
  /** Redes sociales: [{network, url}] */
  social_links?: { network: string; url: string }[];
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
  /** Características del material (nombres traducidos) */
  characteristics?: string[] | null;
}

/** Par material + característica para filtros */
export interface MaterialCharacteristicOption {
  materialId: string;
  materialName: string;
  charName: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ArtistType {
  id: string;
  alias?: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface Technique {
  id: string;
  alias?: string;
  slug: string;
  name: string;
  description?: string | null;
}
