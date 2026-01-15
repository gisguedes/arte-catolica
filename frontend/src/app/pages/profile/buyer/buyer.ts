import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-buyer-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './buyer.html',
  styleUrl: './buyer.scss',
})
export class BuyerProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  user = this.authService.user;
  activeTab = signal<'orders' | 'favorites' | 'addresses' | 'settings'>('orders');

  orders = signal<any[]>([]);
  favorites = signal<any[]>([]);
  addresses = signal<any[]>([]);

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) {
      return;
    }
    this.loadOrders(userId);
    this.loadAddresses(userId);
  }

  setTab(tab: 'orders' | 'favorites' | 'addresses' | 'settings'): void {
    this.activeTab.set(tab);
  }

  private loadOrders(userId: string): void {
    this.apiService.get<{ data: any[] }>(`orders?user_id=${userId}`).subscribe({
      next: (response) => this.orders.set(response.data || (response as any)),
      error: () => this.orders.set([]),
    });
  }

  private loadAddresses(userId: string): void {
    this.apiService.get<{ data: any[] }>(`addresses?user_id=${userId}`).subscribe({
      next: (response) => this.addresses.set(response.data || (response as any)),
      error: () => this.addresses.set([]),
    });
  }
}
