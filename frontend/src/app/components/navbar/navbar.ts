import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  user = this.authService.user;
  isAuthenticated = this.authService.authenticated;
  cartItemCount = this.cartService.totalItems;

  logout(): void {
    this.authService.logout();
  }
}

