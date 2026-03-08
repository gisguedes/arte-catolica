import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{ authorization: { id_token: string } }>;
      };
    };
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showRegister = signal(false);
  errorMessage = '';
  isLoading = false;
  showPasswordLogin = signal(false);
  showPasswordRegister = signal(false);
  showConfirmPassword = signal(false);

  /** Requisitos de contraseña para mostrar en el formulario de registro */
  passwordRequirements = [
    { key: 'length', label: 'Mínimo 8 caracteres', check: (p: string) => (p?.length ?? 0) >= 8 },
    { key: 'uppercase', label: 'Una letra mayúscula', check: (p: string) => /[A-Z]/.test(p ?? '') },
    { key: 'lowercase', label: 'Una letra minúscula', check: (p: string) => /[a-z]/.test(p ?? '') },
    { key: 'number', label: 'Un número', check: (p: string) => /[0-9]/.test(p ?? '') },
    {
      key: 'special',
      label: 'Un carácter especial',
      check: (p: string) => /[^A-Za-z0-9]/.test(p ?? ''),
    },
  ];

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  registerForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), this.passwordStrengthValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  private passwordStrengthValidator(control: AbstractControl) {
    const p = control.value;
    if (!p || p.length < 8) return { passwordStrength: true };
    if (!/[A-Z]/.test(p)) return { passwordStrength: true };
    if (!/[a-z]/.test(p)) return { passwordStrength: true };
    if (!/[0-9]/.test(p)) return { passwordStrength: true };
    if (!/[^A-Za-z0-9]/.test(p)) return { passwordStrength: true };
    return null;
  }

  meetsRequirement(req: { check: (p: string) => boolean }): boolean {
    return req.check(this.registerForm.get('password')?.value ?? '');
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  toggleForm(): void {
    this.showRegister.set(!this.showRegister());
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/es/profile']);
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

      const { confirmPassword, ...registerData } = this.registerForm.value;
      this.authService.register(registerData).subscribe({
        next: () => {
          // Después del registro, iniciar sesión automáticamente
          this.authService
            .login({
              email: this.registerForm.value.email,
              password: this.registerForm.value.password,
            })
            .subscribe({
              next: () => {
                this.router.navigate(['/es/profile']);
              },
              error: () => {
                this.router.navigate(['/es/login']);
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

  ngOnInit(): void {
    this.initGoogle();
  }

  private initGoogle(): void {
    const clientId = environment.googleClientId;
    if (!clientId) return;
    const check = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => this.handleGoogleCredential(res.credential),
        });
        return;
      }
      setTimeout(check, 200);
    };
    check();
  }

  loginWithGoogle(): void {
    if (!environment.googleClientId) {
      this.errorMessage = 'Google Sign-In no está configurado';
      return;
    }
    if (!window.google?.accounts?.id) {
      this.errorMessage = 'Esperando carga de Google. Inténtalo de nuevo.';
      return;
    }
    this.initGoogle();
    this.errorMessage = '';
    window.google.accounts.id.prompt();
  }

  private handleGoogleCredential(credential: string): void {
    this.authService.loginWithGoogle(credential).subscribe({
      next: () => this.router.navigate(['/es/profile']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al iniciar sesión con Google';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  loginWithApple(): void {
    if (!environment.appleClientId) {
      this.errorMessage = 'Apple Sign-In no está configurado';
      return;
    }
    if (!window.AppleID?.auth) {
      this.errorMessage = 'Esperando carga de Apple. Inténtalo de nuevo.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    window.AppleID.auth.init({
      clientId: environment.appleClientId,
      scope: 'name email',
      usePopup: true,
    });
    window.AppleID.auth
      .signIn()
      .then((response) => {
        const idToken = response?.authorization?.id_token;
        if (!idToken) throw new Error('Sin token de Apple');
        this.authService.loginWithApple(idToken).subscribe({
          next: () => this.router.navigate(['/es/profile']),
          error: (err) => {
            this.errorMessage = err.error?.message || 'Error al iniciar sesión con Apple';
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
      })
      .catch((err) => {
        if (err?.error !== 'popup_closed_by_user') {
          this.errorMessage = err?.message || 'Error al iniciar sesión con Apple';
        }
        this.isLoading = false;
      });
  }
}
