import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  VendorService,
  VendorUser,
  VendorBankAccount,
  Company,
} from '../../../services/vendor.service';
import { ProductService } from '../../../services/product.service';
import { ArtistService } from '../../../services/artist.service';
import { LocaleService } from '../../../services/locale.service';
import { Artist, ArtistType, Product } from '../../../models/product.model';
import {
  VENDOR_USER_ROLES,
  VENDOR_ASSIGNABLE_ROLES,
  type VendorUserRole,
} from '../../../constants/vendor-roles';

type TabId = 'products' | 'orders' | 'bank' | 'profile' | 'users' | 'billing' | 'settings';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './seller.html',
  styleUrl: './seller.scss',
})
export class SellerProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private vendorService = inject(VendorService);
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);
  private localeService = inject(LocaleService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly VENDOR_USER_ROLES = VENDOR_USER_ROLES;
  readonly VENDOR_ASSIGNABLE_ROLES = VENDOR_ASSIGNABLE_ROLES;

  locale = this.localeService.locale;
  user = this.authService.user;
  activeTab = signal<TabId>('products');

  /** Grupos del menú vertical; cada uno tiene sub-tabs horizontales */
  readonly SECTIONS: {
    id: string;
    label: string;
    tabs: { id: TabId; label: string; ownerOnly?: boolean }[];
  }[] = [
    {
      id: 'principal',
      label: 'Principal',
      tabs: [
        { id: 'products', label: 'Mis Productos' },
        { id: 'orders', label: 'Pedidos' },
      ],
    },
    { id: 'public', label: 'Datos públicos', tabs: [{ id: 'profile', label: 'Perfil público' }] },
    {
      id: 'finance',
      label: 'Finanzas',
      tabs: [
        { id: 'bank', label: 'Datos bancarios' },
        { id: 'billing', label: 'Facturación' },
      ],
    },
    {
      id: 'team',
      label: 'Equipo y configuración',
      tabs: [
        { id: 'users', label: 'Usuarios', ownerOnly: true },
        { id: 'settings', label: 'Configuración' },
      ],
    },
  ];

  /** Sección activa (derivada del tab actual) */
  currentSectionId = computed(() => {
    const tab = this.activeTab();
    const section = this.SECTIONS.find((s) => s.tabs.some((t) => t.id === tab));
    return section?.id ?? 'principal';
  });

  /** Sub-tabs horizontales de la sección actual (respetando ownerOnly) */
  currentSectionTabs = computed(() => {
    const section = this.SECTIONS.find((s) => s.id === this.currentSectionId());
    if (!section) return [];
    const isOwner = this.vendor()?.my_role === this.VENDOR_USER_ROLES.OWNER;
    return section.tabs.filter((t) => !t.ownerOnly || isOwner);
  });

  selectSection(sectionId: string): void {
    const section = this.SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    const isOwner = this.vendor()?.my_role === this.VENDOR_USER_ROLES.OWNER;
    const first = section.tabs.find((t) => !t.ownerOnly || isOwner);
    if (first) this.setTab(first.id);
  }

  vendor = signal<Artist | null>(null);
  company = signal<Company | null>(null);
  vendorUsers = signal<VendorUser[]>([]);
  artistTypes = signal<ArtistType[]>([]);
  products = signal<Product[]>([]);
  orders = signal<any[]>([]);
  bankAccounts = signal<VendorBankAccount[]>([]);
  /** Cuenta seleccionada para eliminar; si no es null se muestra el modal de confirmación */
  bankAccountToRemove = signal<VendorBankAccount | null>(null);
  /** Modal para crear nueva cuenta bancaria */
  bankAccountModalOpen = signal(false);
  /** Id de la cuenta cuyos datos completos se muestran (solo lectura); null = IBAN oculto */
  bankAccountExpandedId = signal<string | null>(null);
  isUpdatingStatus = signal(false);
  isSavingProfile = signal(false);
  isSavingSettings = signal(false);
  isAddingBank = signal(false);
  isRemovingBank = signal(false);
  isSavingBilling = signal(false);
  isAddingUser = signal(false);
  isRemovingUser = signal(false);
  profileError = signal('');
  profileSuccess = signal(false);
  settingsError = signal('');
  settingsSuccess = signal(false);
  bankError = signal('');
  bankSuccess = signal('');
  billingError = signal('');
  billingSuccess = signal(false);
  usersError = signal('');
  usersSuccess = signal('');
  /** Base64 de nueva imagen, '' = usuario quiere quitar, null = sin cambio */
  imageData = signal<string | null | ''>(null);

  /** Redes sociales soportadas para el selector en el perfil */
  readonly SOCIAL_NETWORKS = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'pinterest', label: 'Pinterest' },
  ] as const;

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    surname: [''],
    website: [''],
    social_links: this.fb.array<FormGroup>([]),
    city: [''],
    postal_code: [''],
    country: [''],
    artist_type_ids: [[] as string[]],
    short_description: [''],
    description: [''],
  });

  /** Imagen a mostrar: nueva seleccionada, o la actual del vendor */
  imagePreview = computed(() => {
    const data = this.imageData();
    if (data === '') return null;
    if (typeof data === 'string') return data;
    return this.vendor()?.image ?? null;
  });

  settingsForm: FormGroup = this.fb.group({
    preparation_days: [7, [Validators.min(0), Validators.max(30)]],
  });

  billingForm: FormGroup = this.fb.group({
    legal_name: [''],
    nif: [''],
    phone: [''],
    email: [''],
    street: [''],
    postal_code: [''],
    city: [''],
    country: [''],
  });

  get socialLinksArray(): FormArray {
    return this.profileForm.get('social_links') as FormArray;
  }

  addSocialLink(network = 'instagram', url = ''): void {
    this.socialLinksArray.push(
      this.fb.group({
        network: [network],
        url: [url],
      }),
    );
  }

  removeSocialLink(index: number): void {
    this.socialLinksArray.removeAt(index);
  }

  addUserForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [VENDOR_USER_ROLES.ADMIN, [Validators.required]],
  });

  bankAccountForm: FormGroup = this.fb.group({
    account_holder_name: ['', [Validators.required]],
    iban: ['', [Validators.required]],
    swift_bic: [''],
    bank_name: [''],
    is_default: [false],
  });

  setTab(tab: TabId): void {
    this.profileSuccess.set(false);
    this.settingsSuccess.set(false);
    this.bankSuccess.set('');
    this.billingSuccess.set(false);
    this.usersSuccess.set('');
    this.profileError.set('');
    this.settingsError.set('');
    this.bankError.set('');
    this.billingError.set('');
    this.usersError.set('');
    this.activeTab.set(tab);
    if (tab === 'users') {
      this.loadVendorUsers();
    }
    if (tab === 'bank') {
      this.loadBankAccounts();
    }
    if (tab === 'billing') {
      this.loadCompany();
    }
  }

  maskIban(iban: string): string {
    if (!iban || iban.length < 8) return iban;
    return '****' + iban.slice(-4);
  }

  /** IBAN formateado con espacios cada 4 caracteres para lectura */
  formatIbanDisplay(iban: string): string {
    if (!iban) return '';
    const clean = iban.replace(/\s/g, '');
    return clean.replace(/(.{4})/g, '$1 ').trim();
  }

  openNewBankAccountModal(): void {
    this.bankAccountForm.reset({
      account_holder_name: '',
      iban: '',
      swift_bic: '',
      bank_name: '',
      is_default: false,
    });
    this.bankError.set('');
    this.bankAccountModalOpen.set(true);
  }

  closeNewBankAccountModal(): void {
    this.bankAccountModalOpen.set(false);
  }

  toggleBankAccountView(accountId: string): void {
    this.bankAccountExpandedId.update((id) => (id === accountId ? null : accountId));
  }

  private loadBankAccounts(): void {
    const v = this.vendor();
    if (!v?.id) return;
    this.vendorService.getBankAccounts(v.id).subscribe({
      next: (list) => this.bankAccounts.set(list),
      error: () => this.bankAccounts.set([]),
    });
  }

  addBankAccount(): void {
    const v = this.vendor();
    if (!v?.id || this.bankAccountForm.invalid) return;
    this.isAddingBank.set(true);
    this.bankError.set('');
    this.bankSuccess.set('');
    const payload = {
      ...this.bankAccountForm.value,
      iban: (this.bankAccountForm.value.iban || '').replace(/\s/g, ''),
    };
    this.vendorService.addBankAccount(v.id, payload).subscribe({
      next: (res) => {
        this.bankAccounts.update((list) => [...list, res.data]);
        this.bankAccountForm.reset({
          account_holder_name: '',
          iban: '',
          swift_bic: '',
          bank_name: '',
          is_default: false,
        });
        this.bankSuccess.set('Cuenta añadida correctamente.');
        this.bankAccountModalOpen.set(false);
        this.isAddingBank.set(false);
      },
      error: (err) => {
        this.bankError.set(err.error?.message ?? 'Error al añadir cuenta');
        this.isAddingBank.set(false);
      },
    });
  }

  confirmRemoveBankAccount(account: VendorBankAccount): void {
    this.bankAccountToRemove.set(account);
  }

  cancelRemoveBankAccount(): void {
    this.bankAccountToRemove.set(null);
  }

  removeBankAccount(): void {
    const account = this.bankAccountToRemove();
    const v = this.vendor();
    if (!v?.id || !account?.id) {
      this.bankAccountToRemove.set(null);
      return;
    }
    this.isRemovingBank.set(true);
    this.bankError.set('');
    this.vendorService.removeBankAccount(v.id, account.id).subscribe({
      next: () => {
        this.bankAccounts.update((list) => list.filter((a) => a.id !== account.id));
        this.bankSuccess.set('Cuenta desactivada. Se mantiene en el historial.');
        this.bankAccountToRemove.set(null);
        this.isRemovingBank.set(false);
      },
      error: (err) => {
        this.bankError.set(err.error?.message ?? 'Error al eliminar');
        this.isRemovingBank.set(false);
      },
    });
  }

  private loadCompany(): void {
    const v = this.vendor();
    if (!v?.id) return;
    this.vendorService.getCompany(v.id).subscribe({
      next: (c) => {
        this.company.set(c ?? null);
        this.billingForm.patchValue(
          {
            legal_name: c?.legal_name ?? '',
            nif: c?.nif ?? '',
            phone: c?.phone ?? '',
            email: c?.email ?? '',
            street: c?.street ?? '',
            postal_code: c?.postal_code ?? '',
            city: c?.city ?? '',
            country: c?.country ?? '',
          },
          { emitEvent: false },
        );
      },
      error: () => this.company.set(null),
    });
  }

  saveBilling(): void {
    const v = this.vendor();
    if (!v?.id) return;
    this.isSavingBilling.set(true);
    this.billingError.set('');
    this.billingSuccess.set(false);
    this.vendorService.updateCompany(v.id, this.billingForm.value).subscribe({
      next: (res) => {
        this.company.set(res.data);
        this.billingSuccess.set(true);
        this.isSavingBilling.set(false);
      },
      error: (err) => {
        this.billingError.set(err.error?.message ?? 'Error al guardar');
        this.isSavingBilling.set(false);
      },
    });
  }

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) {
      return;
    }
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'] as TabId | undefined;
      if (
        tab &&
        ['products', 'orders', 'bank', 'profile', 'users', 'billing', 'settings'].includes(tab)
      ) {
        this.activeTab.set(tab);
      }
    });
    this.artistService.getArtistTypes().subscribe({
      next: (types) => this.artistTypes.set(Array.isArray(types) ? types : []),
      error: () => this.artistTypes.set([]),
    });
    this.vendorService.getVendorByUserId(userId).subscribe({
      next: (vendor) => {
        this.vendor.set(vendor);
        this.patchFormsWithVendor(vendor);
        if (vendor?.id) {
          this.loadProducts(vendor.id);
        }
      },
      error: () => this.vendor.set(null),
    });
  }

  private loadProducts(vendorId: string): void {
    this.productService.getProductsByArtist(vendorId).subscribe({
      next: (products) => this.products.set(products),
      error: () => this.products.set([]),
    });
  }

  productImageUrl(imagePath: string | undefined): string {
    return this.productService.productImageUrl(imagePath);
  }

  navigateToProduct(productId: string): void {
    const loc = this.locale();
    this.router.navigate(['/', loc, 'profile', 'seller', 'products', productId]);
  }

  statusLabel(status?: string): string {
    const labels: Record<string, string> = {
      in_progress: 'En progreso',
      in_review: 'En revisión',
      approved: 'Aprobado',
      archived: 'Archivado',
      cancelled: 'Cancelado',
    };
    return labels[status ?? 'approved'] ?? status ?? 'Aprobado';
  }

  canRequestApproval(status?: string): boolean {
    return status === 'in_progress' || status === 'in_review' || status === 'archived';
  }

  requestApproval(): void {
    const v = this.vendor();
    if (!v?.id) return;
    this.isUpdatingStatus.set(true);
    this.vendorService.updateVendorStatus(v.id, 'approved').subscribe({
      next: (res) => {
        this.vendor.set(res.data);
        this.isUpdatingStatus.set(false);
      },
      error: () => this.isUpdatingStatus.set(false),
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      this.profileError.set('La imagen debe ser menor a 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.imageData.set(reader.result as string);
      this.profileError.set('');
      this.profileSuccess.set(false);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.imageData.set('');
    this.profileSuccess.set(false);
  }

  private patchFormsWithVendor(v: Artist | null): void {
    if (!v) return;
    this.imageData.set(null);
    this.profileForm.patchValue(
      {
        name: v.name ?? '',
        surname: v.surname ?? '',
        website: v.website ?? '',
        city: v.city ?? '',
        postal_code: v.postal_code ?? '',
        country: v.country ?? '',
        artist_type_ids: (v.artist_types ?? []).map((t) => t.id),
        short_description: v.short_description ?? '',
        description: v.description ?? '',
      },
      { emitEvent: false },
    );
    const links = v.social_links ?? [];
    this.socialLinksArray.clear();
    links.forEach((item) => {
      this.addSocialLink(item.network ?? '', item.url ?? '');
    });
    const vAny = v as unknown as { phone?: string; nif?: string };
    this.settingsForm.patchValue(
      {
        phone: vAny.phone ?? '',
        nif: vAny.nif ?? '',
        preparation_days: v.preparation_days ?? 7,
      },
      { emitEvent: false },
    );
  }

  toggleArtistType(typeId: string): void {
    const current = (this.profileForm.get('artist_type_ids')?.value as string[]) ?? [];
    const next = current.includes(typeId)
      ? current.filter((id) => id !== typeId)
      : [...current, typeId];
    this.profileForm.patchValue({ artist_type_ids: next });
  }

  isArtistTypeSelected(typeId: string): boolean {
    const ids = (this.profileForm.get('artist_type_ids')?.value as string[]) ?? [];
    return ids.includes(typeId);
  }

  saveProfile(): void {
    const v = this.vendor();
    if (!v?.id || this.profileForm.invalid) return;
    this.isSavingProfile.set(true);
    this.profileError.set('');
    this.profileSuccess.set(false);
    const raw = this.profileForm.value;
    const social_links =
      (raw.social_links as { network: string; url: string }[])
        ?.filter((item) => item?.url?.trim())
        ?.map((item) => ({
          network: (item.network || 'instagram').toLowerCase(),
          url: item.url.trim(),
        })) ?? [];
    const payload = {
      ...raw,
      artist_type_ids: (raw.artist_type_ids ?? []).filter(Boolean),
      social_links,
    };
    const img = this.imageData();
    if (img === '') {
      payload.image = null;
    } else if (typeof img === 'string') {
      payload.image = img;
    }
    this.vendorService.updateVendor(v.id, payload).subscribe({
      next: (res) => {
        this.vendor.set(res.data);
        this.imageData.set(null);
        this.profileSuccess.set(true);
        this.isSavingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(
          typeof err.error?.message === 'string' && err.error.message.length < 200
            ? err.error.message
            : 'Error al guardar. Comprueba que la imagen sea menor a 2 MB.',
        );
        this.isSavingProfile.set(false);
      },
    });
  }

  roleLabel(role: VendorUserRole | string): string {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      finanzas: 'Finanzas',
      logistica: 'Logística',
      comercial: 'Comercial',
    };
    return labels[role] ?? role;
  }

  private loadVendorUsers(): void {
    const v = this.vendor();
    if (!v?.id) return;
    this.vendorService.getVendorUsers(v.id).subscribe({
      next: (res) => this.vendorUsers.set(res.data ?? []),
      error: () => this.vendorUsers.set([]),
    });
  }

  addUser(): void {
    const v = this.vendor();
    if (!v?.id || this.addUserForm.invalid) return;
    const { email, role } = this.addUserForm.value;
    this.isAddingUser.set(true);
    this.usersError.set('');
    this.usersSuccess.set('');
    this.vendorService.addVendorUser(v.id, email, role).subscribe({
      next: (res) => {
        const d = res.data;
        this.vendorUsers.update((list) => [
          ...list,
          {
            id: d.user_id,
            user_id: d.user_id,
            role: d.role,
            name: d.name,
            surname: d.surname,
            email: d.email,
          },
        ]);
        this.addUserForm.patchValue({ email: '', role: VENDOR_USER_ROLES.ADMIN });
        this.usersSuccess.set('Usuario añadido correctamente.');
        this.isAddingUser.set(false);
      },
      error: (err) => {
        this.usersError.set(err.error?.message ?? 'Error al añadir usuario');
        this.isAddingUser.set(false);
      },
    });
  }

  removeUser(u: VendorUser): void {
    const v = this.vendor();
    if (!v?.id || !u.user_id) return;
    this.isRemovingUser.set(true);
    this.usersError.set('');
    this.vendorService.removeVendorUser(v.id, u.user_id).subscribe({
      next: () => {
        this.vendorUsers.update((list) => list.filter((x) => x.user_id !== u.user_id));
        this.usersSuccess.set('Usuario eliminado del equipo.');
        this.isRemovingUser.set(false);
      },
      error: (err) => {
        this.usersError.set(err.error?.message ?? 'Error al eliminar');
        this.isRemovingUser.set(false);
      },
    });
  }

  saveSettings(): void {
    const v = this.vendor();
    if (!v?.id || this.settingsForm.invalid) return;
    this.isSavingSettings.set(true);
    this.settingsError.set('');
    this.settingsSuccess.set(false);
    const payload = this.settingsForm.value;
    this.vendorService.updateVendor(v.id, payload).subscribe({
      next: (res) => {
        this.vendor.set(res.data);
        this.settingsSuccess.set(true);
        this.isSavingSettings.set(false);
      },
      error: (err) => {
        this.settingsError.set(err.error?.message ?? 'Error al guardar');
        this.isSavingSettings.set(false);
      },
    });
  }
}
