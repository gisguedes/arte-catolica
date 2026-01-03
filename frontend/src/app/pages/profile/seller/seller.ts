import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller.html',
  styleUrl: './seller.scss',
})
export class SellerProfileComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
  activeTab = signal<'products' | 'orders' | 'bank' | 'settings'>('products');

  products = signal<any[]>([]);
  orders = signal<any[]>([]);
  bankAccounts = signal<any[]>([]);

  setTab(tab: 'products' | 'orders' | 'bank' | 'settings'): void {
    this.activeTab.set(tab);
  }

  deliveryTime = signal(7); // días
}

