import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private cartService = inject(CartService);
  imageIndex = signal(0);

  currentImage = computed(() => {
    const images = this.product.images ?? [];
    if (images.length > 0) {
      return images[this.imageIndex() % images.length].image_path;
    }
    return this.product.image || '/assets/placeholder-image.jpg';
  });

  hasGallery = computed(() => (this.product.images?.length ?? 0) > 1);
  galleryIndices = computed(() => {
    const total = this.product.images?.length ?? 0;
    return Array.from({ length: total }, (_, index) => index);
  });

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.addToCart(this.product);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price ?? 0);
  }

  nextImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const total = this.product.images?.length ?? 0;
    if (total > 1) {
      this.imageIndex.set((this.imageIndex() + 1) % total);
    }
  }

  prevImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const total = this.product.images?.length ?? 0;
    if (total > 1) {
      this.imageIndex.set((this.imageIndex() - 1 + total) % total);
    }
  }

}

