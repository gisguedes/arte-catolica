import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api';
import { AuthService } from './auth.service';

export type FavoriteStatus = 'in_review' | 'approved' | 'archived' | 'cancelled';

export interface FavoriteProduct {
  id: string;
  product_id: string;
  status?: FavoriteStatus;
  name: string;
  price: number;
  image: string | null;
  created_at: string;
}

export interface FavoriteArtist {
  id: string;
  vendor_id: string;
  status?: FavoriteStatus;
  name: string;
  image: string | null;
  short_description: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  favorites = signal<FavoriteProduct[]>([]);
  favoriteArtists = signal<FavoriteArtist[]>([]);

  loadFavorites(): void {
    const userId = this.authService.user()?.id;
    if (!userId) {
      this.favorites.set([]);
      this.favoriteArtists.set([]);
      return;
    }
    this.apiService.get<{ data: FavoriteProduct[] }>(`favorites?user_id=${userId}`).subscribe({
      next: (response) => this.favorites.set(response.data ?? []),
      error: () => this.favorites.set([]),
    });
    this.apiService
      .get<{ data: FavoriteArtist[] }>(`favorites/artists?user_id=${userId}`)
      .subscribe({
        next: (response) => this.favoriteArtists.set(response.data ?? []),
        error: () => this.favoriteArtists.set([]),
      });
  }

  addFavorite(productId: string): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.apiService.post('favorites', { user_id: userId, product_id: productId }).subscribe({
      next: () => this.loadFavorites(),
    });
  }

  removeFavorite(productId: string): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.apiService.delete(`favorites/${productId}?user_id=${userId}`).subscribe({
      next: () => this.loadFavorites(),
    });
  }

  isFavorite(productId: string): boolean {
    return this.favorites().some((f) => f.product_id === productId);
  }

  toggleFavorite(productId: string): boolean {
    if (this.isFavorite(productId)) {
      this.removeFavorite(productId);
      return false;
    }
    this.addFavorite(productId);
    return true;
  }

  addFavoriteArtist(vendorId: string): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.apiService.post('favorites/artists', { user_id: userId, vendor_id: vendorId }).subscribe({
      next: () => this.loadFavorites(),
    });
  }

  removeFavoriteArtist(vendorId: string): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.apiService.delete(`favorites/artists/${vendorId}?user_id=${userId}`).subscribe({
      next: () => this.loadFavorites(),
    });
  }

  isFavoriteArtist(vendorId: string): boolean {
    return this.favoriteArtists().some((f) => f.vendor_id === vendorId);
  }

  toggleFavoriteArtist(vendorId: string): boolean {
    if (this.isFavoriteArtist(vendorId)) {
      this.removeFavoriteArtist(vendorId);
      return false;
    }
    this.addFavoriteArtist(vendorId);
    return true;
  }
}
