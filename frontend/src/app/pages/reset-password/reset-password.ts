import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private localeService = inject(LocaleService);

  locale = this.localeService.locale;
  token = signal<string | null>(null);
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  private passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    this.token.set(t || null);
  }

  onRequestReset(): void {
    if (!this.requestForm.valid) return;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api.forgotPassword(this.requestForm.value.email).subscribe({
      next: (res) => {
        this.successMessage =
          res.message || 'Si el email existe, recibirás instrucciones por correo.';
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al solicitar restablecimiento.';
        this.isLoading = false;
      },
    });
  }

  onReset(): void {
    const t = this.token();
    if (!t || !this.resetForm.valid) return;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const password = this.resetForm.value.password;
    this.api.resetPassword(t, password).subscribe({
      next: () => {
        this.successMessage = 'Contraseña actualizada. Redirigiendo al inicio de sesión...';
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/', this.localeService.getCurrentLocale(), 'login']);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al restablecer la contraseña.';
        this.isLoading = false;
      },
    });
  }
}
