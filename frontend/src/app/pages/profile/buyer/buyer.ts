import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-buyer-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './buyer.html',
  styleUrl: './buyer.scss',
})
export class BuyerProfileComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
  activeTab = signal<'orders' | 'favorites' | 'addresses' | 'settings'>('orders');

  orders = signal<any[]>([]);
  favorites = signal<any[]>([]);
  addresses = signal<any[]>([]);

  setTab(tab: 'orders' | 'favorites' | 'addresses' | 'settings'): void {
    this.activeTab.set(tab);
  }
}

