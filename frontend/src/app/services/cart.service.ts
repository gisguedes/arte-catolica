import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { CartItem, Product } from '../models/product.model';
import { ApiService } from './api';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private items = signal<CartItem[]>(this.loadCartFromStorage());

  // Computed signals
  totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  totalPrice = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  get cartItems() {
    return this.items.asReadonly();
  }

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user?.id) {
        this.loadRemoteCart(user.id);
      } else {
        this.items.set(this.loadCartFromStorage());
      }
    });
  }

  addToCart(product: Product, quantity: number = 1): void {
    const userId = this.getUserId();
    if (userId) {
      this.apiService
        .post<{ data: CartItem[] }>('cart', {
          user_id: userId,
          product_id: product.id,
          quantity,
        })
        .subscribe({
          next: (response) =>
            this.items.set(this.normalizeCartItems(response.data || (response as any))),
        });
      return;
    }
    const currentItems = this.items();
    const existingItem = currentItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      this.items.set(
        currentItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        ),
      );
    } else {
      this.items.set([...currentItems, { product, quantity }]);
    }
    this.saveCartToStorage();
  }

  removeFromCart(productId: string): void {
    const userId = this.getUserId();
    if (userId) {
      this.apiService
        .delete<{ data: CartItem[] }>(`cart?user_id=${userId}&product_id=${productId}`)
        .subscribe({
          next: (response) =>
            this.items.set(this.normalizeCartItems(response.data || (response as any))),
        });
      return;
    }
    this.items.set(this.items().filter((item) => item.product.id !== productId));
    this.saveCartToStorage();
  }

  updateQuantity(productId: string, quantity: number): void {
    const userId = this.getUserId();
    if (userId) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
        return;
      }
      this.apiService
        .post<{ data: CartItem[] }>('cart', {
          user_id: userId,
          product_id: productId,
          quantity,
        })
        .subscribe({
          next: (response) =>
            this.items.set(this.normalizeCartItems(response.data || (response as any))),
        });
      return;
    }
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.items.set(
      this.items().map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    );
    this.saveCartToStorage();
  }

  clearCart(): void {
    const userId = this.getUserId();
    if (userId) {
      this.apiService.delete(`cart/clear?user_id=${userId}`).subscribe({
        next: () => this.items.set([]),
      });
      return;
    }
    this.items.set([]);
    this.saveCartToStorage();
  }

  private loadRemoteCart(userId: string): void {
    this.apiService.get<{ data: CartItem[] }>(`cart?user_id=${userId}`).subscribe({
      next: (response) =>
        this.items.set(this.normalizeCartItems(response.data || (response as any))),
      error: () => this.items.set([]),
    });
  }

  private normalizeCartItems(items: CartItem[]): CartItem[] {
    return (items || []).map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: Number(item.product?.price ?? 0),
      },
    }));
  }

  private getUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  private loadCartFromStorage(): CartItem[] {
    const cartStr = localStorage.getItem('cart');
    return cartStr ? JSON.parse(cartStr) : [];
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.items()));
  }
}
