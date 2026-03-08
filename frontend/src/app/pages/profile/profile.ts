import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { VendorService } from '../../services/vendor.service';
import { ApiService } from '../../services/api';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private vendorService = inject(VendorService);
  private apiService = inject(ApiService);
  private localeService = inject(LocaleService);

  locale = this.localeService.locale;
  user = this.authService.user;
  hasSellerProfile = signal(false);
  hasBuyerProfile = signal(false);

  /** Solo mostrar perfil vendedor cuando tiene AMBOS (ha comprado Y es vendedor). Si solo es vendedor, no mostrarlo. */
  showSellerOption = computed(() => this.hasSellerProfile() && this.hasBuyerProfile());

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) return;
    this.vendorService.getVendorByUserId(userId).subscribe({
      next: (vendor) => this.hasSellerProfile.set(!!vendor),
      error: () => this.hasSellerProfile.set(false),
    });
    this.apiService.get<{ data: unknown[] }>(`orders?user_id=${userId}`).subscribe({
      next: (res) => this.hasBuyerProfile.set((res.data ?? (res as any))?.length > 0),
      error: () => this.hasBuyerProfile.set(false),
    });
  }
}
