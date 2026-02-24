import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private localeService = inject(LocaleService);
  private el = inject(ElementRef);

  locale = this.localeService.locale;
  user = this.authService.user;
  isAuthenticated = this.authService.authenticated;
  cartItemCount = this.cartService.totalItems;
  isMenuOpen = signal(false);
  isCatalogOpen = signal(false);
  isLangOpen = signal(false);

  toggleCatalog(): void {
    this.isCatalogOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeCatalog();
      this.closeLang();
    }
  }

  closeCatalog(): void {
    this.isCatalogOpen.set(false);
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
  }
}
