import {
  Component,
  Input,
  inject,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) product!: Product;

  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private favoritesService = inject(FavoritesService);
  authService = inject(AuthService);
  imageIndex = signal(0);
  firstShipDate = signal<string | null>(null);

  currentImage = computed(() => {
    const images = this.product.images ?? [];
    if (images.length > 0) {
      return images[this.imageIndex() % images.length].image_path;
    }
    return this.product.image || '/assets/placeholder-image.jpg';
  });

  artistCountry = computed(
    () => this.product?.vendor?.country ?? this.product?.artist?.country ?? null,
  );

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

  isFavorite = computed(
    () =>
      this.authService.authenticated() &&
      this.favoritesService.favorites().some((f) => f.product_id === this.product.id),
  );

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authService.authenticated()) return;
    this.favoritesService.toggleFavorite(this.product.id);
  }

  ngOnInit(): void {
    this.loadFirstShipDate();
    const name = this.product?.vendor?.name || this.product?.artist?.name || null;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3d6fb066-d5c2-417c-b90d-dfa24731bc3e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'product-card.ts:ngOnInit',
        message: 'product card artist label',
        data: { productId: this.product?.id, artistName: name },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H5',
      }),
    }).catch(() => {});
    // #endregion
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && !changes['product'].firstChange) {
      this.firstShipDate.set(null);
      this.loadFirstShipDate();
    }
  }

  private loadFirstShipDate(): void {
    const id = this.product?.id;
    if (!id) return;
    const destination = this.product?.vendor
      ? { country: this.product.vendor.country, postal_code: this.product.vendor.postal_code }
      : undefined;
    this.productService.getShippingCalendar(id, destination).subscribe({
      next: (cal) => {
        const date = cal.default_ship_date ?? cal.ship_dates?.[0] ?? null;
        this.firstShipDate.set(date);
      },
      error: () => this.firstShipDate.set(null),
    });
  }

  /** Emoji de bandera a partir del código ISO de país (ej. ES → 🇪🇸) */
  countryFlag(countryCode: string | null | undefined): string {
    if (!countryCode || countryCode.length !== 2) return '';
    const code = countryCode.toUpperCase();
    return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)));
  }

  /** Formato dd/mm/yyyy para la primera fecha de entrega */
  formatDateDDMMYYYY(dateKey: string | null): string {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const day = (d ?? 0).toString().padStart(2, '0');
    const month = (m ?? 0).toString().padStart(2, '0');
    const year = y ?? 0;
    return `${day}/${month}/${year}`;
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
