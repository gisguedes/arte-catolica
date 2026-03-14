import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { VendorService } from '../../services/vendor.service';
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
  private localeService = inject(LocaleService);

  locale = this.localeService.locale;
  user = this.authService.user;
  hasSellerProfile = signal(false);

  /** Mostrar perfil vendedor cuando el usuario es vendedor. Todo vendedor tiene también perfil de comprador. */
  showSellerOption = computed(() => this.hasSellerProfile());

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) return;
    this.vendorService.getVendorByUserId(userId).subscribe({
      next: (vendor) => this.hasSellerProfile.set(!!vendor),
      error: () => this.hasSellerProfile.set(false),
    });
  }
}
