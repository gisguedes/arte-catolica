import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

const ADDED_NOTIFICATION_DURATION_MS = 4000;
const CART_STORAGE_KEY = 'arte-catolica-cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items = signal<CartItem[]>(this.loadCartFromStorage());
  private addedNotificationTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Producto recién añadido (para mostrar modal de confirmación) */
  addedProduct = signal<Product | null>(null);

  private static isProductAvailable(product: Product): boolean {
    const status = product?.status ?? 'approved';
    return status !== 'archived' && status !== 'cancelled';
  }

  // Computed signals (solo productos disponibles cuentan para totals)
  totalItems = computed(() =>
    this.items().reduce(
      (sum, item) => sum + (CartService.isProductAvailable(item.product) ? item.quantity : 0),
      0,
    ),
  );

  totalPrice = computed(() =>
    this.items().reduce(
      (sum, item) =>
        sum +
        (CartService.isProductAvailable(item.product) ? item.product.price * item.quantity : 0),
      0,
    ),
  );

  isProductAvailable = CartService.isProductAvailable;

  get cartItems() {
    return this.items.asReadonly();
  }

  /** Actualiza el status de los productos en el carrito (para detectar archived/cancelled) */
  refreshProductStatus(statusMap: Record<string, string>): void {
    if (Object.keys(statusMap).length === 0) return;
    this.items.update((items) =>
      items.map((item) => {
        const newStatus = statusMap[item.product.id];
        if (!newStatus) return item;
        return {
          ...item,
          product: { ...item.product, status: newStatus as Product['status'] },
        };
      }),
    );
    this.saveCartToStorage();
  }

  addToCart(product: Product, quantity: number = 1): void {
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
    this.showAddedNotification(product);
  }

  /** Muestra el modal temporal de "producto añadido" */
  showAddedNotification(product: Product): void {
    if (this.addedNotificationTimeout) clearTimeout(this.addedNotificationTimeout);
    this.addedProduct.set(product);
    this.addedNotificationTimeout = setTimeout(() => {
      this.addedProduct.set(null);
      this.addedNotificationTimeout = null;
    }, ADDED_NOTIFICATION_DURATION_MS);
  }

  dismissAddedNotification(): void {
    if (this.addedNotificationTimeout) clearTimeout(this.addedNotificationTimeout);
    this.addedNotificationTimeout = null;
    this.addedProduct.set(null);
  }

  removeFromCart(productId: string): void {
    this.items.set(this.items().filter((item) => item.product.id !== productId));
    this.saveCartToStorage();
  }

  updateQuantity(productId: string, quantity: number): void {
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
    this.items.set([]);
    this.saveCartToStorage();
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const cartStr = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartStr) return [];
      const parsed = JSON.parse(cartStr) as CartItem[];
      return this.normalizeCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      // QuotaExceeded o localStorage no disponible
    }
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
}
