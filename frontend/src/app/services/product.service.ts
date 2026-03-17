import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from './api';
import {
  Product,
  Category,
  Technique,
  Material,
  ShippingCalendar,
  CreateProductPayload,
  UpdateProductPayload,
  ColorOption,
  ProductPriceContract,
  AddProductPricePayload,
  ProductImage,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiService = inject(ApiService);

  /** URL completa para una imagen de producto (image_path puede ser ruta relativa) */
  productImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.apiService.getBaseUrl()}/uploads/${imagePath}`;
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      price: Number(product.price ?? 0),
      height_cm: product.height_cm !== undefined ? Number(product.height_cm) : undefined,
      width_cm: product.width_cm !== undefined ? Number(product.width_cm) : undefined,
      depth_cm: product.depth_cm !== undefined ? Number(product.depth_cm) : undefined,
    };
  }

  getProducts(params?: {
    categorySlug?: string;
    techniqueSlug?: string;
    materialSlug?: string | string[];
    characteristicSlug?: string | string[];
  }): Observable<Product[]> {
    const search = new URLSearchParams();
    if (params?.categorySlug) search.set('category_slug', params.categorySlug);
    if (params?.techniqueSlug) search.set('technique_slug', params.techniqueSlug);
    if (params?.materialSlug) {
      (Array.isArray(params.materialSlug) ? params.materialSlug : [params.materialSlug]).forEach(
        (s) => search.append('material_slug', s),
      );
    }
    if (params?.characteristicSlug) {
      (Array.isArray(params.characteristicSlug)
        ? params.characteristicSlug
        : [params.characteristicSlug]
      ).forEach((s) => search.append('characteristic_slug', s));
    }
    const query = search.toString();
    const endpoint = query ? `products?${query}` : 'products';
    return this.apiService
      .get<{ data: Product[] }>(endpoint)
      .pipe(
        map((response) =>
          (response.data || (response as any)).map((p: Product) => this.normalizeProduct(p)),
        ),
      );
  }

  getMaterials(): Observable<Material[]> {
    return this.apiService
      .get<{ data: Material[] }>('materials')
      .pipe(map((response) => response.data || (response as any)));
  }

  getTechniques(): Observable<Technique[]> {
    return this.apiService
      .get<{ data: Technique[] }>('techniques')
      .pipe(map((response) => response.data || (response as any)));
  }

  getTechniqueBySlug(slug: string): Observable<Technique> {
    return this.apiService
      .get<{ data: Technique }>(`techniques?slug=${encodeURIComponent(slug)}`)
      .pipe(map((response) => response.data || (response as any)));
  }

  getProductStatus(ids: string[]): Observable<Record<string, string>> {
    if (ids.length === 0) return of({});
    const search = new URLSearchParams();
    ids.forEach((id) => search.append('ids', id));
    return this.apiService
      .get<{ data: Record<string, string> }>(`products/status?${search.toString()}`)
      .pipe(map((r) => r?.data ?? {}));
  }

  getProduct(id: string): Observable<Product> {
    return this.apiService
      .get<{ data: Product }>(`products/${id}`)
      .pipe(map((response) => this.normalizeProduct(response.data || (response as any))));
  }

  getCategories(): Observable<Category[]> {
    return this.apiService
      .get<{ data: Category[] }>('categories')
      .pipe(map((response) => response.data || (response as any)));
  }

  getColors(): Observable<ColorOption[]> {
    return this.apiService
      .get<{ data: ColorOption[] }>('colors')
      .pipe(map((response) => response.data || (response as any)));
  }

  createProduct(vendorId: string, payload: CreateProductPayload): Observable<{ data: Product }> {
    return this.apiService
      .post<{ data: Product }>(`vendors/${vendorId}/products`, payload)
      .pipe(map((r) => ({ data: this.normalizeProduct(r.data) })));
  }

  updateProduct(
    vendorId: string,
    productId: string,
    payload: UpdateProductPayload,
  ): Observable<{ data: Product }> {
    return this.apiService
      .patch<{ data: Product }>(`vendors/${vendorId}/products/${productId}`, payload)
      .pipe(map((r) => ({ data: this.normalizeProduct(r.data) })));
  }

  getProductsByArtist(artistId: string): Observable<Product[]> {
    return this.apiService
      .get<{ data: Product[] }>(`vendors/${artistId}/products`)
      .pipe(
        map((response) =>
          (response.data || (response as any)).map((p: Product) => this.normalizeProduct(p)),
        ),
      );
  }

  getProductPrices(vendorId: string, productId: string): Observable<ProductPriceContract[]> {
    return this.apiService
      .get<{ data: ProductPriceContract[] }>(`vendors/${vendorId}/products/${productId}/prices`)
      .pipe(map((r) => r.data ?? []));
  }

  addProductPrice(
    vendorId: string,
    productId: string,
    payload: AddProductPricePayload,
  ): Observable<{ data: ProductPriceContract }> {
    return this.apiService.post<{ data: ProductPriceContract }>(
      `vendors/${vendorId}/products/${productId}/prices`,
      payload,
    );
  }

  uploadProductImage(
    vendorId: string,
    productId: string,
    payload: { image: string; order?: number; is_primary?: boolean; color_id?: string | null },
  ): Observable<{ data: ProductImage }> {
    return this.apiService.post<{ data: ProductImage }>(
      `vendors/${vendorId}/products/${productId}/images`,
      payload,
    );
  }

  patchProductImage(
    vendorId: string,
    productId: string,
    imageId: string,
    payload: { color_id?: string | null; order?: number; is_primary?: boolean },
  ): Observable<{ data: ProductImage }> {
    return this.apiService.patch<{ data: ProductImage }>(
      `vendors/${vendorId}/products/${productId}/images/${imageId}`,
      payload,
    );
  }

  deleteProductImage(vendorId: string, productId: string, imageId: string): Observable<void> {
    return this.apiService.delete<void>(
      `vendors/${vendorId}/products/${productId}/images/${imageId}`,
    );
  }

  getShippingCalendar(
    productId: string,
    destination?: { country?: string; postal_code?: string; region?: string },
  ): Observable<ShippingCalendar> {
    const params = new URLSearchParams();
    if (destination?.country) {
      params.set('destination_country', destination.country);
    }
    if (destination?.postal_code) {
      params.set('destination_postal_code', destination.postal_code);
    }
    if (destination?.region) {
      params.set('destination_region', destination.region);
    }
    const query = params.toString();
    const endpoint = query
      ? `products/${productId}/shipping-calendar?${query}`
      : `products/${productId}/shipping-calendar`;
    return this.apiService
      .get<{ data: ShippingCalendar }>(endpoint)
      .pipe(map((response) => response.data || (response as any)));
  }
}
