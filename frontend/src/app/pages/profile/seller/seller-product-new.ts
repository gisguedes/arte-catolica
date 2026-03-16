import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { VendorService } from '../../../services/vendor.service';
import { AuthService } from '../../../services/auth.service';
import { LocaleService } from '../../../services/locale.service';
import {
  Category,
  Material,
  Technique,
  ColorOption,
  Artist,
  CreateProductPayload,
} from '../../../models/product.model';

@Component({
  selector: 'app-seller-product-new',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './seller-product-new.html',
  styleUrl: './seller.scss',
})
export class SellerProductNewComponent implements OnInit {
  private productService = inject(ProductService);
  private vendorService = inject(VendorService);
  private authService = inject(AuthService);
  private localeService = inject(LocaleService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  locale = this.localeService.locale;
  user = this.authService.user;
  vendor = signal<Artist | null>(null);
  categories = signal<Category[]>([]);
  materials = signal<Material[]>([]);
  techniques = signal<Technique[]>([]);
  colors = signal<ColorOption[]>([]);
  isSubmitting = signal(false);
  errorMessage = signal('');

  categorySearch = signal('');
  materialSearch = signal('');
  techniqueSearch = signal('');
  colorSearch = signal('');

  filteredCategories = computed(() => {
    const list = this.categories();
    const q = (this.categorySearch() || '').trim().toLowerCase();
    const selected = (this.form.get('category_ids')?.value as string[]) ?? [];
    return list.filter(
      (c) => !selected.includes(c.id) && (!q || (c.name || '').toLowerCase().includes(q))
    );
  });
  filteredMaterials = computed(() => {
    const list = this.materials();
    const q = (this.materialSearch() || '').trim().toLowerCase();
    const selected = (this.form.get('material_ids')?.value as string[]) ?? [];
    return list.filter(
      (m) => !selected.includes(m.id) && (!q || (m.name || '').toLowerCase().includes(q))
    );
  });
  filteredTechniques = computed(() => {
    const list = this.techniques();
    const q = (this.techniqueSearch() || '').trim().toLowerCase();
    const selected = (this.form.get('technique_ids')?.value as string[]) ?? [];
    return list.filter(
      (t) => !selected.includes(t.id) && (!q || (t.name || '').toLowerCase().includes(q))
    );
  });
  filteredColors = computed(() => {
    const list = this.colors();
    const q = (this.colorSearch() || '').trim().toLowerCase();
    const selected = (this.form.get('color_ids')?.value as string[]) ?? [];
    return list.filter(
      (c) => !selected.includes(c.id) && (!q || (c.name || '').toLowerCase().includes(q))
    );
  });

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    stock: [null as number | null, [Validators.min(0)]],
    availability: [''],
    height_cm: [null as number | null, [Validators.min(0)]],
    width_cm: [null as number | null, [Validators.min(0)]],
    depth_cm: [null as number | null, [Validators.min(0)]],
    sku: [''],
    category_ids: [[] as string[]],
    material_ids: [[] as string[]],
    technique_ids: [[] as string[]],
    color_ids: [[] as string[]],
  });

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) {
      this.router.navigate(['/', this.locale(), 'login']);
      return;
    }
    this.vendorService.getVendorByUserId(userId).subscribe({
      next: (v: Artist | null) => {
        this.vendor.set(v ?? null);
        if (!v?.id) {
          this.router.navigate(['/', this.locale(), 'profile', 'seller']);
        }
      },
      error: () => this.vendor.set(null),
    });
    this.productService.getCategories().subscribe({
      next: (list: Category[]) => this.categories.set(list ?? []),
      error: () => this.categories.set([]),
    });
    this.productService.getMaterials().subscribe({
      next: (list: Material[]) => this.materials.set(list ?? []),
      error: () => this.materials.set([]),
    });
    this.productService.getTechniques().subscribe({
      next: (list: Technique[]) => this.techniques.set(list ?? []),
      error: () => this.techniques.set([]),
    });
    this.productService.getColors().subscribe({
      next: (list: ColorOption[]) => this.colors.set(list ?? []),
      error: () => this.colors.set([]),
    });
  }

  toggleArray(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const current: string[] = control.value ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    control.setValue(next);
  }

  isSelected(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): boolean {
    const control = this.form.get(controlName);
    const arr: string[] = control?.value ?? [];
    return arr.includes(id);
  }

  getSelectedItems(
    controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids',
    list: Category[] | Material[] | Technique[] | ColorOption[]
  ): { id: string; name: string }[] {
    const control = this.form.get(controlName);
    const ids: string[] = control?.value ?? [];
    return list.filter((x) => ids.includes(x.id)).map((x) => ({ id: x.id, name: (x as { name?: string }).name ?? '' }));
  }

  removeFromArray(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): void {
    this.toggleArray(controlName, id);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    const v = this.vendor();
    if (!v?.id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const raw = this.form.value;
    const payload: CreateProductPayload = {
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() : undefined,
      stock: raw.stock != null && raw.stock !== '' ? Number(raw.stock) : undefined,
      availability: raw.availability ? String(raw.availability).trim() || undefined : undefined,
      height_cm: raw.height_cm != null && raw.height_cm !== '' ? Number(raw.height_cm) : undefined,
      width_cm: raw.width_cm != null && raw.width_cm !== '' ? Number(raw.width_cm) : undefined,
      depth_cm: raw.depth_cm != null && raw.depth_cm !== '' ? Number(raw.depth_cm) : undefined,
      sku: raw.sku ? String(raw.sku).trim() : undefined,
      category_ids: (raw.category_ids ?? []).filter(Boolean),
      material_ids: (raw.material_ids ?? []).filter(Boolean),
      technique_ids: (raw.technique_ids ?? []).filter(Boolean),
      color_ids: (raw.color_ids ?? []).filter(Boolean),
    };

    this.productService.createProduct(v.id, payload).subscribe({
      next: () => {
        this.router.navigate(['/', this.locale(), 'profile', 'seller'], {
          queryParams: { tab: 'products' },
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Error al crear el producto');
        this.isSubmitting.set(false);
      },
    });
  }
}
