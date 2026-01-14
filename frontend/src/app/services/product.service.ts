import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Product, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiService = inject(ApiService);

  getProducts(categoryId?: string): Observable<Product[]> {
    const endpoint = categoryId ? `products?category_id=${categoryId}` : 'products';
    return this.apiService.get<{ data: Product[] }>(endpoint).pipe(
      map(response => response.data || response as any)
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.apiService.get<{ data: Product }>(`products/${id}`).pipe(
      map(response => response.data || response as any)
    );
  }

  getCategories(): Observable<Category[]> {
    return this.apiService.get<{ data: Category[] }>('categories').pipe(
      map(response => response.data || response as any)
    );
  }

  getProductsByArtist(artistId: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[] }>(`artists/${artistId}/products`).pipe(
      map(response => response.data || response as any)
    );
  }
}
