import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { VendorService } from '../../services/vendor.service';
import { ApiService } from '../../services/api';
import { LocaleService } from '../../services/locale.service';

export interface ArtistType {
  id: string;
  alias: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-become-seller',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './become-seller.html',
  styleUrl: './become-seller.scss',
})
export class BecomeSellerComponent implements OnInit {
  private authService = inject(AuthService);
  private vendorService = inject(VendorService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private localeService = inject(LocaleService);
  private fb = inject(FormBuilder);

  locale = this.localeService.locale;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  artistTypes = signal<ArtistType[]>([]);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    surname: ['', [Validators.required, Validators.minLength(1)]],
    phone: [''],
    nif: [''],
    artist_type_ids: [[] as string[]],
    short_description: [''],
  });

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) {
      const fullReturn = `/${this.localeService.getCurrentLocale()}/ser-vendedor`;
      this.router.navigate(['/', this.localeService.getCurrentLocale(), 'login'], {
        queryParams: { returnUrl: fullReturn },
      });
      return;
    }

    this.form.patchValue({
      name: user.name ?? '',
      surname: user.surname ?? '',
    });

    this.apiService.get<{ data: ArtistType[] }>('artist-types').subscribe({
      next: (res) => {
        const data = res.data ?? (res as { data?: ArtistType[] }).data ?? [];
        this.artistTypes.set(Array.isArray(data) ? data : []);
      },
      error: () => this.artistTypes.set([]),
    });

    this.vendorService.getVendorByUserId(user.id).subscribe({
      next: (vendor) => {
        this.isLoading = false;
        if (vendor) {
          this.router.navigate(['/', this.localeService.getCurrentLocale(), 'profile', 'seller']);
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  toggleArtistType(id: string): void {
    const current = (this.form.get('artist_type_ids')?.value as string[]) ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.form.patchValue({ artist_type_ids: next });
  }

  isArtistTypeSelected(id: string): boolean {
    const ids = (this.form.get('artist_type_ids')?.value as string[]) ?? [];
    return ids.includes(id);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const value = this.form.value;
    const payload = {
      name: value.name?.trim(),
      surname: value.surname?.trim(),
      phone: value.phone?.trim() || undefined,
      nif: value.nif?.trim() || undefined,
      artist_type_ids: (value.artist_type_ids ?? []).filter(Boolean),
      short_description: value.short_description?.trim() || undefined,
    };

    this.vendorService.createVendor(payload).subscribe({
      next: () => {
        this.router.navigate(['/', this.localeService.getCurrentLocale(), 'profile', 'seller']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Error al crear el perfil de vendedor';
        this.isSubmitting = false;
      },
    });
  }
}
