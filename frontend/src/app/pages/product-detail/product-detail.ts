import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  product = signal<Product | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  imageIndex = signal(0);

  currentImage = computed(() => {
    const product = this.product();
    const images = product?.images ?? [];
    if (images.length > 0) {
      return images[this.imageIndex() % images.length].image_path;
    }
    return product?.image || '/assets/placeholder-image.jpg';
  });

  hasGallery = computed(() => (this.product()?.images?.length ?? 0) > 1);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage.set('Producto no encontrado');
      this.isLoading.set(false);
      return;
    }

    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el producto');
        this.isLoading.set(false);
      },
    });
  }

  addToCart(): void {
    const product = this.product();
    if (product) {
      this.cartService.addToCart(product);
    }
  }

  prevImage(): void {
    const total = this.product()?.images?.length ?? 0;
    if (total > 1) {
      this.imageIndex.set((this.imageIndex() - 1 + total) % total);
    }
  }

  nextImage(): void {
    const total = this.product()?.images?.length ?? 0;
    if (total > 1) {
      this.imageIndex.set((this.imageIndex() + 1) % total);
    }
  }

  availabilityLabel(): string {
    const availability = this.product()?.availability;
    if (availability === 'on_demand') return 'Bajo demanda';
    if (availability === 'limited') return 'Stock limitado';
    return 'En stock';
  }

  deliveryEstimate(): string {
    const availability = this.product()?.availability;
    return availability === 'on_demand' ? 'Bajo demanda' : '1 a 2 días laborables';
  }

  shippingFrom(): string {
    const vendor = this.product()?.vendor;
    if (!vendor) {
      return '';
    }
    const parts = [vendor.city, vendor.postal_code, vendor.country].filter(Boolean);
    return parts.join(', ');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price ?? 0);
  }
}

