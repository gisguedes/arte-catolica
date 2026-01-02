import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { Product, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiService = inject(ApiService);

  getProducts(categoryId?: number): Observable<Product[]> {
    const endpoint = categoryId ? `products?category_id=${categoryId}` : 'products';
    return this.apiService.get<Product[]>(endpoint);
  }

  getProduct(id: number): Observable<Product> {
    return this.apiService.get<Product>(`products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>('categories');
  }

  getProductsByArtist(artistId: number): Observable<Product[]> {
    return this.apiService.get<Product[]>(`artists/${artistId}/products`);
  }
}

