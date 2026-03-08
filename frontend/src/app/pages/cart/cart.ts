import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  ngOnInit(): void {
    const ids = this.cartService.cartItems().map((i) => i.product.id);
    if (ids.length > 0) {
      this.productService.getProductStatus(ids).subscribe({
        next: (statusMap) => this.cartService.refreshProductStatus(statusMap),
      });
    }
  }

  cartItems = this.cartService.cartItems;
  totalPrice = this.cartService.totalPrice;
  totalItems = this.cartService.totalItems;
  isProductAvailable = this.cartService.isProductAvailable;

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    // TODO: Implementar checkout
    alert('Funcionalidad de checkout próximamente');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price ?? 0);
  }
}
