import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api';
import { FavoritesService } from '../../../services/favorites.service';
import { LocaleService } from '../../../services/locale.service';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  product_status?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  items: OrderItem[];
  total: number;
  [key: string]: any;
}

@Component({
  selector: 'app-buyer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './buyer.html',
  styleUrl: './buyer.scss',
})
export class BuyerProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private favoritesService = inject(FavoritesService);
  private fb = inject(FormBuilder);
  private localeService = inject(LocaleService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  locale = this.localeService.locale;
  user = this.authService.user;
  activeTab = signal<'personal' | 'orders' | 'favorites'>('personal');
  orders = signal<Order[]>([]);
  favorites = this.favoritesService.favorites;
  favoriteArtists = this.favoritesService.favoriteArtists;
  isSaving = signal(false);
  personalError = signal('');
  personalSuccess = signal(false);
  avatarData = signal<string | null>(null);

  personalForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    surname: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  setTab(tab: 'personal' | 'orders' | 'favorites'): void {
    this.personalSuccess.set(false);
    this.activeTab.set(tab);
    if (tab === 'favorites') {
      this.favoritesService.loadFavorites();
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Planificado',
      planned: 'Planificado',
      shipping: 'En camino',
      in_transit: 'En camino',
      shipped: 'En camino',
      delivered: 'Entregado',
    };
    return map[status?.toLowerCase()] ?? status ?? 'Planificado';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price ?? 0);
  }

  removeFavoriteProduct(productId: string): void {
    this.favoritesService.removeFavorite(productId);
  }

  removeFavoriteArtist(vendorId: string): void {
    this.favoritesService.removeFavoriteArtist(vendorId);
  }

  getOrderItems(order: Order): OrderItem[] {
    return order?.items ?? [];
  }

  getFirstProductImage(order: Order): string | null {
    const items = this.getOrderItems(order);
    return items[0]?.product_image || null;
  }

  avatarPreview = signal<string | null>(null);

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      this.personalError.set('La imagen debe ser menor a 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.avatarData.set(data);
      this.avatarPreview.set(data);
      this.personalError.set('');
      this.personalSuccess.set(false);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeAvatar(): void {
    this.avatarData.set('');
    this.avatarPreview.set(null);
    this.personalSuccess.set(false);
  }

  getFirstProductName(order: Order): string {
    const items = this.getOrderItems(order);
    return items[0]?.product_name ?? 'Producto';
  }

  onSavePersonal(): void {
    if (!this.personalForm.valid) return;
    this.isSaving.set(true);
    this.personalError.set('');
    this.personalSuccess.set(false);
    const payload = { ...this.personalForm.value };
    const avatar = this.avatarData();
    if (avatar !== null) {
      payload.avatar = avatar;
    }
    this.apiService.patch('me', payload).subscribe({
      next: (response: any) => {
        const data = response.data ?? response;
        if (data) {
          this.authService.updateUser(data);
          if (data.avatar !== undefined) {
            this.avatarPreview.set(data.avatar || null);
          }
          this.avatarData.set(null);
          this.personalError.set('');
          this.personalSuccess.set(true);
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        const msg = err.error?.message ?? err.message ?? 'Error al guardar';
        // Evitar mostrar base64 o mensajes muy largos
        const safeMsg =
          typeof msg === 'string' && (msg.startsWith('data:') || msg.length > 200)
            ? 'Error al guardar. Comprueba que la imagen sea menor a 2 MB.'
            : msg;
        this.personalError.set(safeMsg);
        this.personalSuccess.set(false);
        this.isSaving.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.personalForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.personalSuccess.set(false));
    const tab = this.activatedRoute.snapshot.queryParamMap.get('tab');
    if (tab === 'orders' || tab === 'favorites' || tab === 'personal') {
      this.activeTab.set(tab);
    }
    const u = this.user();
    if (u) {
      this.personalForm.patchValue({ name: u.name, surname: u.surname ?? '', email: u.email });
      if (u.avatar) {
        this.avatarPreview.set(u.avatar);
      }
    }
    const userId = u?.id;
    if (userId) {
      this.loadOrders(userId);
    }
    this.favoritesService.loadFavorites();
  }

  private loadOrders(userId: string): void {
    this.apiService.get<{ data: Order[] }>(`orders?user_id=${userId}`).subscribe({
      next: (response) => this.orders.set(response.data ?? (response as any) ?? []),
      error: () => this.orders.set([]),
    });
  }
}
