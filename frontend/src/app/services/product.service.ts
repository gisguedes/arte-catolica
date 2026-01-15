import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Product, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiService = inject(ApiService);

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      price: Number(product.price ?? 0),
      height_cm: product.height_cm !== undefined ? Number(product.height_cm) : undefined,
      width_cm: product.width_cm !== undefined ? Number(product.width_cm) : undefined,
      depth_cm: product.depth_cm !== undefined ? Number(product.depth_cm) : undefined,
    };
  }

  getProducts(categorySlug?: string): Observable<Product[]> {
    const endpoint = categorySlug ? `products?category_slug=${categorySlug}` : 'products';
    return this.apiService.get<{ data: Product[] }>(endpoint).pipe(
      map(response => (response.data || response as any).map((p: Product) => this.normalizeProduct(p)))
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.apiService.get<{ data: Product }>(`products/${id}`).pipe(
      map(response => this.normalizeProduct(response.data || response as any))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.apiService.get<{ data: Category[] }>('categories').pipe(
      map(response => response.data || response as any)
    );
  }

  getProductsByArtist(artistId: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[] }>(`vendors/${artistId}/products`).pipe(
      map(response => (response.data || response as any).map((p: Product) => this.normalizeProduct(p)))
    );
  }
}
