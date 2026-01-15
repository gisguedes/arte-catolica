import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { VendorService } from '../../../services/vendor.service';
import { ProductService } from '../../../services/product.service';
import { Artist, Product } from '../../../models/product.model';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller.html',
  styleUrl: './seller.scss',
})
export class SellerProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private vendorService = inject(VendorService);
  private productService = inject(ProductService);

  user = this.authService.user;
  activeTab = signal<'products' | 'orders' | 'bank' | 'settings'>('products');

  vendor = signal<Artist | null>(null);
  products = signal<Product[]>([]);
  orders = signal<any[]>([]);
  bankAccounts = signal<any[]>([]);

  setTab(tab: 'products' | 'orders' | 'bank' | 'settings'): void {
    this.activeTab.set(tab);
  }

  deliveryTime = signal(7); // días

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) {
      return;
    }
    this.vendorService.getVendorByUserId(userId).subscribe({
      next: (vendor) => {
        this.vendor.set(vendor);
        if (vendor?.id) {
          this.loadProducts(vendor.id);
        }
      },
      error: () => this.vendor.set(null),
    });
  }

  private loadProducts(vendorId: string): void {
    this.productService.getProductsByArtist(vendorId).subscribe({
      next: (products) => this.products.set(products),
      error: () => this.products.set([]),
    });
  }
}
