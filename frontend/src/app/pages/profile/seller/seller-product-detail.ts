import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { VendorService } from '../../../services/vendor.service';
import { AuthService } from '../../../services/auth.service';
import { LocaleService } from '../../../services/locale.service';
import {
  Product,
  Artist,
  ProductPriceContract,
  AddProductPricePayload,
  UpdateProductPayload,
  Category,
  Material,
  Technique,
  ColorOption,
} from '../../../models/product.model';

@Component({
  selector: 'app-seller-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './seller-product-detail.html',
  styleUrl: './seller.scss',
})
export class SellerProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private vendorService = inject(VendorService);
  private authService = inject(AuthService);
  private localeService = inject(LocaleService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  locale = this.localeService.locale;
  user = this.authService.user;
  vendor = signal<Artist | null>(null);
  product = signal<Product | null>(null);
  prices = signal<ProductPriceContract[]>([]);
  isSubmitting = signal(false);
  errorMessage = signal('');
  priceSuccess = signal('');
  imageUploading = signal(false);
  imageError = signal('');
  editSubmitting = signal(false);
  editSuccess = signal('');
  categories = signal<Category[]>([]);
  materials = signal<Material[]>([]);
  techniques = signal<Technique[]>([]);
  colors = signal<ColorOption[]>([]);
  categorySearch = signal('');
  materialSearch = signal('');
  techniqueSearch = signal('');
  colorSearch = signal('');
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  productDetailTab = signal<'info' | 'images' | 'prices'>('info');
  priceModalOpen = signal(false);
  productId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  sortedProductImages = computed(() => {
    const images = this.product()?.images ?? [];
    return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  setProductDetailTab(tab: 'info' | 'images' | 'prices'): void {
    this.productDetailTab.set(tab);
  }

  openPriceModal(): void {
    this.priceForm.patchValue({
      price: null,
      start_date: '',
      end_date: '',
      previous_end_date: '',
    });
    this.errorMessage.set('');
    this.priceSuccess.set('');
    this.priceModalOpen.set(true);
  }

  closePriceModal(): void {
    this.priceModalOpen.set(false);
  }

  filteredCategories = computed(() => {
    const list = this.categories();
    const q = (this.categorySearch() || '').trim().toLowerCase();
    const selected = (this.editForm.get('category_ids')?.value as string[]) ?? [];
    return list.filter(
      (c) => !selected.includes(c.id) && (!q || (c.name || '').toLowerCase().includes(q))
    );
  });
  filteredMaterials = computed(() => {
    const list = this.materials();
    const q = (this.materialSearch() || '').trim().toLowerCase();
    const selected = (this.editForm.get('material_ids')?.value as string[]) ?? [];
    return list.filter(
      (m) => !selected.includes(m.id) && (!q || (m.name || '').toLowerCase().includes(q))
    );
  });
  filteredTechniques = computed(() => {
    const list = this.techniques();
    const q = (this.techniqueSearch() || '').trim().toLowerCase();
    const selected = (this.editForm.get('technique_ids')?.value as string[]) ?? [];
    return list.filter(
      (t) => !selected.includes(t.id) && (!q || (t.name || '').toLowerCase().includes(q))
    );
  });
  filteredColors = computed(() => {
    const list = this.colors();
    const q = (this.colorSearch() || '').trim().toLowerCase();
    const selected = (this.editForm.get('color_ids')?.value as string[]) ?? [];
    return list.filter(
      (c) => !selected.includes(c.id) && (!q || (c.name || '').toLowerCase().includes(q))
    );
  });

  priceForm: FormGroup = this.fb.group({
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    start_date: [''],
    end_date: [''],
    previous_end_date: [''],
  });

  editForm: FormGroup = this.fb.group({
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
      next: (v) => {
        this.vendor.set(v ?? null);
        if (!v?.id) {
          this.router.navigate(['/', this.locale(), 'profile', 'seller']);
          return;
        }
        const id = this.productId();
        if (!id) {
          this.router.navigate(['/', this.locale(), 'profile', 'seller']);
          return;
        }
        this.productService.getProduct(id).subscribe({
          next: (prod) => {
            this.product.set(prod);
            if (prod.vendor_id !== v?.id) {
              this.router.navigate(['/', this.locale(), 'profile', 'seller']);
              return;
            }
            this.patchEditForm(prod);
            this.loadPrices(v.id, id);
          },
          error: () => this.router.navigate(['/', this.locale(), 'profile', 'seller']),
        });
      },
      error: () => this.vendor.set(null),
    });
    this.productService.getCategories().subscribe({
      next: (list) => this.categories.set(list ?? []),
      error: () => this.categories.set([]),
    });
    this.productService.getMaterials().subscribe({
      next: (list) => this.materials.set(list ?? []),
      error: () => this.materials.set([]),
    });
    this.productService.getTechniques().subscribe({
      next: (list) => this.techniques.set(list ?? []),
      error: () => this.techniques.set([]),
    });
    this.productService.getColors().subscribe({
      next: (list) => this.colors.set(list ?? []),
      error: () => this.colors.set([]),
    });
  }

  private patchEditForm(prod: Product): void {
    this.editForm.patchValue({
      name: prod.name ?? '',
      description: prod.description ?? '',
      stock: prod.stock ?? null,
      availability: prod.availability ?? '',
      height_cm: prod.height_cm ?? null,
      width_cm: prod.width_cm ?? null,
      depth_cm: prod.depth_cm ?? null,
      sku: prod.sku ?? '',
      category_ids: prod.categories?.map((c) => c.id) ?? [],
      material_ids: prod.materials?.map((m) => m.id) ?? [],
      technique_ids: prod.techniques?.map((t) => t.id) ?? [],
      color_ids: prod.colors?.map((c) => c.id) ?? [],
    });
  }

  private loadPrices(vendorId: string, productId: string): void {
    this.productService.getProductPrices(vendorId, productId).subscribe({
      next: (list) => this.prices.set(list ?? []),
      error: () => this.prices.set([]),
    });
  }

  onSubmitPrice(): void {
    if (this.priceForm.invalid || this.isSubmitting()) return;
    const v = this.vendor();
    const id = this.productId();
    if (!v?.id || !id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.priceSuccess.set('');

    const raw = this.priceForm.value;
    const payload: AddProductPricePayload = {
      price: Number(raw.price),
      start_date: raw.start_date?.trim() || undefined,
      end_date: raw.end_date?.trim() || undefined,
      previous_end_date: raw.previous_end_date?.trim() || undefined,
    };

    this.productService.addProductPrice(v.id, id, payload).subscribe({
      next: () => {
        this.loadPrices(v.id, id);
        this.priceForm.patchValue({
          price: null,
          start_date: '',
          end_date: '',
          previous_end_date: '',
        });
        this.priceSuccess.set('Precio añadido correctamente.');
        this.isSubmitting.set(false);
        this.closePriceModal();
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Error al añadir el precio');
        this.isSubmitting.set(false);
      },
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString(this.locale() === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(d: string | undefined): string {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString(this.locale() === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat(this.locale() === 'en' ? 'en-GB' : 'es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  productImageUrl(imagePath: string | undefined): string {
    return this.productService.productImageUrl(imagePath);
  }

  private reloadProduct(): void {
    const v = this.vendor();
    const id = this.productId();
    if (!v?.id || !id) return;
    this.productService.getProduct(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.patchEditForm(prod);
      },
      error: () => {},
    });
  }

  toggleArray(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): void {
    const control = this.editForm.get(controlName);
    if (!control) return;
    const current: string[] = control.value ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    control.setValue(next);
  }

  isSelected(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): boolean {
    const arr: string[] = this.editForm.get(controlName)?.value ?? [];
    return arr.includes(id);
  }

  getSelectedItems(
    controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids',
    list: Category[] | Material[] | Technique[] | ColorOption[]
  ): { id: string; name: string }[] {
    const ids: string[] = this.editForm.get(controlName)?.value ?? [];
    return list.filter((x) => ids.includes(x.id)).map((x) => ({ id: x.id, name: (x as { name?: string }).name ?? '' }));
  }

  removeFromArray(controlName: 'category_ids' | 'material_ids' | 'technique_ids' | 'color_ids', id: string): void {
    this.toggleArray(controlName, id);
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid || this.editSubmitting()) return;
    const v = this.vendor();
    const id = this.productId();
    if (!v?.id || !id) return;

    this.editSubmitting.set(true);
    this.errorMessage.set('');
    this.editSuccess.set('');

    const raw = this.editForm.value;
    const payload: UpdateProductPayload = {
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() : undefined,
      stock: raw.stock != null && raw.stock !== '' ? Number(raw.stock) : null,
      availability: raw.availability ? String(raw.availability).trim() || null : null,
      height_cm: raw.height_cm != null && raw.height_cm !== '' ? Number(raw.height_cm) : null,
      width_cm: raw.width_cm != null && raw.width_cm !== '' ? Number(raw.width_cm) : null,
      depth_cm: raw.depth_cm != null && raw.depth_cm !== '' ? Number(raw.depth_cm) : null,
      sku: raw.sku ? String(raw.sku).trim() : null,
      category_ids: (raw.category_ids ?? []).filter(Boolean),
      material_ids: (raw.material_ids ?? []).filter(Boolean),
      technique_ids: (raw.technique_ids ?? []).filter(Boolean),
      color_ids: (raw.color_ids ?? []).filter(Boolean),
    };

    this.productService.updateProduct(v.id, id, payload).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.editSuccess.set('Datos del producto guardados.');
        this.editSubmitting.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message ?? 'Error al guardar los datos');
        this.editSubmitting.set(false);
      },
    });
  }

  onImageColorChange(imageId: string, value: string): void {
    const v = this.vendor();
    const productId = this.productId();
    if (!v?.id || !productId) return;
    const colorId = value === '' || value === 'null' ? null : value;
    this.imageError.set('');
    this.productService.patchProductImage(v.id, productId, imageId, { color_id: colorId }).subscribe({
      next: () => this.reloadProduct(),
      error: (err: { error?: { message?: string } }) =>
        this.imageError.set(err.error?.message ?? 'Error al asignar el color'),
    });
  }

  moveImageOrder(imageId: string, direction: 'up' | 'down'): void {
    const v = this.vendor();
    const productId = this.productId();
    if (!v?.id || !productId) return;
    const sorted = this.sortedProductImages();
    const idx = sorted.findIndex((img) => img.id === imageId);
    if (idx < 0) return;
    const otherIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (otherIdx < 0 || otherIdx >= sorted.length) return;
    const current = sorted[idx];
    const other = sorted[otherIdx];
    const currentOrder = current.order ?? idx;
    const otherOrder = other.order ?? otherIdx;
    this.imageError.set('');
    this.productService.patchProductImage(v.id, productId, imageId, { order: otherOrder }).subscribe({
      next: () => {
        this.productService
          .patchProductImage(v.id, productId, other.id, { order: currentOrder })
          .subscribe({
            next: () => this.reloadProduct(),
            error: (err: { error?: { message?: string } }) =>
              this.imageError.set(err.error?.message ?? 'Error al cambiar el orden'),
          });
      },
      error: (err: { error?: { message?: string } }) =>
        this.imageError.set(err.error?.message ?? 'Error al cambiar el orden'),
    });
  }

  onDeleteImage(imageId: string): void {
    const v = this.vendor();
    const productId = this.productId();
    if (!v?.id || !productId) return;
    if (!confirm('¿Eliminar esta foto del producto?')) return;
    this.imageError.set('');
    this.productService.deleteProductImage(v.id, productId, imageId).subscribe({
      next: () => this.reloadProduct(),
      error: (err: { error?: { message?: string } }) =>
        this.imageError.set(err.error?.message ?? 'Error al eliminar la foto'),
    });
  }

  triggerUpload(): void {
    this.fileInputRef?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const v = this.vendor();
    const productId = this.productId();
    if (!v?.id || !productId) return;
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Selecciona un archivo de imagen (JPG, PNG, etc.).');
      return;
    }
    this.imageUploading.set(true);
    this.imageError.set('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.productService.uploadProductImage(v.id, productId, { image: dataUrl }).subscribe({
        next: () => {
          this.reloadProduct();
          this.imageUploading.set(false);
          input.value = '';
        },
        error: (err: { error?: { message?: string } }) => {
          this.imageError.set(err.error?.message ?? 'Error al subir la foto');
          this.imageUploading.set(false);
          input.value = '';
        },
      });
    };
    reader.onerror = () => {
      this.imageError.set('No se pudo leer el archivo.');
      this.imageUploading.set(false);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }
}
