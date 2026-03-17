import type { VendorUserRole } from '../constants/vendor-roles';

export type ProductStatus = 'in_review' | 'approved' | 'archived' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  status?: ProductStatus;
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
  sku?: string;
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

export type ArtistStatus = 'in_progress' | 'in_review' | 'approved' | 'archived' | 'cancelled';

export interface Artist {
  id: string;
  name: string;
  surname?: string | null;
  status?: ArtistStatus;
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
  /** Días de preparación (plazo de entrega), solo para perfil vendedor */
  preparation_days?: number;
  /** Rol del usuario actual en este vendor. Solo presente cuando se consulta con auth */
  my_role?: VendorUserRole | null;
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
  /** Si está asignado, al hacer clic en este color en la ficha producto se muestra esta foto */
  color_id?: string | null;
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

/** Contrato de precio de un producto (vigencia por fechas) */
export interface ProductPriceContract {
  id: string;
  product_id: string;
  price: number;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

/** Payload para añadir un nuevo precio desde el panel del vendedor */
export interface AddProductPricePayload {
  price: number;
  start_date?: string;
  end_date?: string;
  previous_end_date?: string;
}

/** Payload para crear un producto desde el panel del vendedor */
export interface CreateProductPayload {
  name: string;
  description?: string;
  price?: number;
  stock?: number;
  availability?: string;
  height_cm?: number;
  width_cm?: number;
  depth_cm?: number;
  sku?: string;
  category_ids?: string[];
  material_ids?: string[];
  technique_ids?: string[];
  color_ids?: string[];
}

/** Payload para actualizar un producto (todos los campos opcionales; name no puede enviarse vacío) */
export interface UpdateProductPayload {
  name?: string;
  description?: string;
  stock?: number | null;
  availability?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  sku?: string | null;
  category_ids?: string[];
  material_ids?: string[];
  technique_ids?: string[];
  color_ids?: string[];
}
