import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showRegister = signal(false);
  errorMessage = '';
  isLoading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    surname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleForm(): void {
    this.showRegister.set(!this.showRegister());
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/profile']);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al iniciar sesión';
          this.isLoading = false;
        },
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // Después del registro, iniciar sesión automáticamente
          this.authService.login({
            email: this.registerForm.value.email,
            password: this.registerForm.value.password,
          }).subscribe({
            next: () => {
              this.router.navigate(['/profile']);
            },
            error: () => {
              this.router.navigate(['/login']);
            },
          });
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al crear la cuenta';
          this.isLoading = false;
        },
      });
    }
  }

  loginWithGoogle(): void {
    // TODO: Implementar login con Google
    console.log('Login with Google');
    alert('Login con Google - Próximamente');
  }

  loginWithApple(): void {
    // TODO: Implementar login con Apple
    console.log('Login with Apple');
    alert('Login con Apple - Próximamente');
  }
}
