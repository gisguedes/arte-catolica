import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../services/api';
import { AuthService } from '../../../../services/auth.service';
import { LocaleService } from '../../../../services/locale.service';

export interface OrderAddress {
  id: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
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
  address: OrderAddress | null;
  payment_method?: any;
  carrier?: { id: string; name: string; service_level?: string } | null;
  tracking_number?: string | null;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  created_at: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private localeService = inject(LocaleService);

  locale = this.localeService.locale;
  order = signal<Order | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

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

  productImage(item: OrderItem): string {
    return item.product_image || '/assets/placeholder-image.jpg';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Pedido no encontrado');
      this.isLoading.set(false);
      return;
    }
    this.apiService.get<{ data: Order }>(`orders/${id}`).subscribe({
      next: (response) => {
        this.order.set(response.data ?? (response as any));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar el pedido');
        this.isLoading.set(false);
      },
    });
  }
}
