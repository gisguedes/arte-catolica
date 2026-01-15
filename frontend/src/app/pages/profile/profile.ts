import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.user;
  selectedRole = signal<'buyer' | 'seller' | null>(null);

  hasBuyerProfile = computed(() => {
    // TODO: Verificar si el usuario tiene perfil de comprador
    return true;
  });

  hasSellerProfile = computed(() => {
    // TODO: Verificar si el usuario tiene perfil de vendedor
    return false;
  });

  selectRole(role: 'buyer' | 'seller'): void {
    this.selectedRole.set(role);
    if (role === 'buyer') {
      this.router.navigate(['/es/profile/buyer']);
    } else if (role === 'seller') {
      this.router.navigate(['/es/profile/seller']);
    }
  }
}

