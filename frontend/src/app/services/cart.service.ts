import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items = signal<CartItem[]>(this.loadCartFromStorage());

  // Computed signals
  totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  totalPrice = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  get cartItems() {
    return this.items.asReadonly();
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentItems = this.items();
    const existingItem = currentItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      this.items.set(
        currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      this.items.set([...currentItems, { product, quantity }]);
    }
    this.saveCartToStorage();
  }

  removeFromCart(productId: number): void {
    this.items.set(this.items().filter((item) => item.product.id !== productId));
    this.saveCartToStorage();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.items.set(
      this.items().map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    this.saveCartToStorage();
  }

  clearCart(): void {
    this.items.set([]);
    this.saveCartToStorage();
  }

  private loadCartFromStorage(): CartItem[] {
    const cartStr = localStorage.getItem('cart');
    return cartStr ? JSON.parse(cartStr) : [];
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.items()));
  }
}

