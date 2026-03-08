import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { LocaleService } from '../../services/locale.service';
import { Product, ShippingCalendar, Material } from '../../models/product.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private localeService = inject(LocaleService);
  private favoritesService = inject(FavoritesService);
  authService = inject(AuthService);

  locale = this.localeService.locale;

  product = signal<Product | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  imageIndex = signal(0);
  shippingCalendar = signal<ShippingCalendar | null>(null);
  selectedShipDate = signal<string | null>(null);
  calendarMonth = signal(new Date());
  showCalendarModal = signal(false);
  showFullscreen = signal(false);

  private fullscreenEffect = effect(() => {
    if (this.showFullscreen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  currentImage = computed(() => {
    const product = this.product();
    const images = product?.images ?? [];
    if (images.length > 0) {
      return images[this.imageIndex() % images.length].image_path;
    }
    return product?.image || '/assets/placeholder-image.jpg';
  });

  hasGallery = computed(() => (this.product()?.images?.length ?? 0) > 1);

  artistCountry = computed(
    () => this.product()?.vendor?.country ?? this.product()?.artist?.country ?? null,
  );

  monthLabel = computed(() =>
    this.calendarMonth().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
  );

  firstAvailableDateLabel = computed(() => {
    const selected = this.selectedShipDate();
    if (!selected) return 'Sin fechas disponibles';
    return this.formatDateDDMMYYYY(selected);
  });

  /** Emoji de bandera a partir del código ISO de país (ej. ES → 🇪🇸) */
  countryFlag(countryCode: string | null | undefined): string {
    if (!countryCode || countryCode.length !== 2) return '';
    const code = countryCode.toUpperCase();
    return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)));
  }

  /** Formato dd/mm/yyyy para la fecha de previsión de entrega */
  formatDateDDMMYYYY(dateKey: string | null): string {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  calendarDays = computed(() => {
    const calendar = this.shippingCalendar();
    if (!calendar) {
      return [];
    }
    const available = new Set(calendar.ship_dates || []);
    const selected = this.selectedShipDate();
    return this.buildCalendarDays(this.calendarMonth(), available, selected);
  });

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    if (this.authService.authenticated()) {
      this.favoritesService.loadFavorites();
    }
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage.set('Producto no encontrado');
      this.isLoading.set(false);
      return;
    }

    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        const status = product?.status || 'approved';
        if (status === 'cancelled') {
          this.router.navigate(['/', this.localeService.getCurrentLocale(), 'products']);
          return;
        }
        this.product.set(product);
        this.isLoading.set(false);
        this.errorMessage.set('');
        this.loadShippingCalendar(productId, product);
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
  //
  deliveryEstimate(): string {
    const availability = this.product()?.availability;
    return availability === 'on_demand' ? 'Bajo demanda' : '1 a 2 días laborables';
  }

  openCalendarModal(): void {
    if (this.shippingCalendar()) {
      this.showCalendarModal.set(true);
    }
  }

  closeCalendarModal(): void {
    this.showCalendarModal.set(false);
  }

  openFullscreen(): void {
    this.showFullscreen.set(true);
  }

  closeFullscreen(): void {
    this.showFullscreen.set(false);
  }

  isFavorite(): boolean {
    const p = this.product();
    return p ? this.authService.authenticated() && this.favoritesService.isFavorite(p.id) : false;
  }

  toggleFavorite(): void {
    const p = this.product();
    if (!p || !this.authService.authenticated()) return;
    this.favoritesService.toggleFavorite(p.id);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showFullscreen()) {
      this.closeFullscreen();
    }
  }

  selectShipDate(dateKey: string | undefined): void {
    if (dateKey) this.selectedShipDate.set(dateKey);
  }

  goPrevMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  goNextMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  deliveryRangeLabel(): string {
    const calendar = this.shippingCalendar();
    const selected = this.selectedShipDate();
    if (!calendar || !selected) {
      return '';
    }
    const shipDate = new Date(`${selected}T00:00:00`);
    const minDate = this.addDays(shipDate, calendar.transit_days_min);
    const maxDate = this.addDays(shipDate, calendar.transit_days_max);
    const formatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
    return `Entrega estimada: ${formatter.format(minDate)} – ${formatter.format(maxDate)}`;
  }

  private loadShippingCalendar(productId: string, product: Product): void {
    const destination = {
      country: product.vendor?.country || undefined,
      postal_code: product.vendor?.postal_code || undefined,
    };
    this.productService.getShippingCalendar(productId, destination).subscribe({
      next: (calendar) => {
        this.shippingCalendar.set(calendar);
        const defaultDate = calendar.default_ship_date || calendar.ship_dates?.[0] || null;
        this.selectedShipDate.set(defaultDate);
        if (defaultDate) {
          const month = new Date(`${defaultDate}T00:00:00`);
          this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth(), 1));
        }
      },
      error: () => {
        this.shippingCalendar.set(null);
      },
    });
  }

  private buildCalendarDays(monthDate: Date, available: Set<string>, selected?: string | null) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];

    for (let i = 0; i < startOffset; i += 1) {
      days.push({ isPlaceholder: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = this.formatDateKey(date);
      const isAvailable = available.has(key);
      days.push({
        label: day,
        key,
        isAvailable,
        isSelected: key === selected,
      });
    }

    return days;
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
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
