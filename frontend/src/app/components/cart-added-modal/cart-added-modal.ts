import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-cart-added-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-added-modal.html',
  styleUrl: './cart-added-modal.scss',
})
export class CartAddedModalComponent {
  private cartService = inject(CartService);
  private localeService = inject(LocaleService);

  product = this.cartService.addedProduct;

  locale(): string {
    return this.localeService.getCurrentLocale();
  }

  productThumbnail = computed(() => {
    const p = this.product();
    if (!p) return '/assets/placeholder-image.jpg';
    const images = p.images ?? [];
    if (images.length > 0) return images[0].image_path;
    return p.image ?? '/assets/placeholder-image.jpg';
  });

  dismiss(): void {
    this.cartService.dismissAddedNotification();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price ?? 0);
  }
}
