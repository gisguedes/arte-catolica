import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { VendorService } from '../../services/vendor.service';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CartAddedModalComponent } from '../cart-added-modal/cart-added-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, CartAddedModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private vendorService = inject(VendorService);
  router = inject(Router);
  private localeService = inject(LocaleService);
  private el = inject(ElementRef);

  locale = this.localeService.locale;
  hasSellerProfile = signal(false);
  isOnSellerPage = signal(false);
  user = this.authService.user;
  isAuthenticated = this.authService.authenticated;
  cartItemCount = this.cartService.totalItems;
  isMenuOpen = signal(false);
  isCatalogOpen = signal(false);
  isLangOpen = signal(false);
  isAreaOpen = signal(false);

  loginUrlWithReturn(): string {
    const base = `/${this.locale()}/login`;
    const current = this.router.url;
    if (!current || current === '/' || current.startsWith('/login')) return base;
    return `${base}?returnUrl=${encodeURIComponent(current)}`;
  }

  toggleCatalog(): void {
    this.isCatalogOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeCatalog();
      this.closeLang();
      this.closeArea();
    }
  }

  closeCatalog(): void {
    this.isCatalogOpen.set(false);
  }

  toggleArea(): void {
    this.isAreaOpen.update((v) => !v);
  }

  closeArea(): void {
    this.isAreaOpen.set(false);
  }

  toggleLang(): void {
    this.isLangOpen.update((v) => !v);
  }

  closeLang(): void {
    this.isLangOpen.set(false);
  }

  selectLocale(loc: 'es' | 'en'): void {
    this.localeService.setLocale(loc);
    this.closeLang();
    this.closeMenu();
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
    this.closeCatalog();
    this.closeLang();
    this.closeArea();
  }

  ngOnInit(): void {
    this.updateIsOnSellerPage();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateIsOnSellerPage());
    const user = this.authService.user();
    if (user?.id) {
      this.vendorService.getVendorByUserId(user.id).subscribe({
        next: (vendor) => this.hasSellerProfile.set(!!vendor),
        error: () => this.hasSellerProfile.set(false),
      });
    }
  }

  private updateIsOnSellerPage(): void {
    this.isOnSellerPage.set(this.router.url?.includes('/profile/seller') ?? false);
  }
}
