import { Component, inject, OnInit, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ProductService } from '../../services/product.service';
import { ArtistService } from '../../services/artist.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import {
  Category,
  Artist,
  Product,
  Material,
  Technique,
  MaterialCharacteristicOption,
} from '../../models/product.model';

@Component({
  selector: 'app-technique-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, TranslatePipe],
  templateUrl: './technique-detail.html',
  styleUrl: './technique-detail.scss',
})
export class TechniqueDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);
  private localeService = inject(LocaleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  locale = this.localeService.locale;

  technique = signal<Technique | null>(null);
  categories = signal<Category[]>([]);
  artists = signal<Artist[]>([]);
  materials = signal<Material[]>([]);
  products = signal<Product[]>([]);

  materialCharacteristicsOptions = computed((): MaterialCharacteristicOption[] => {
    const seen = new Set<string>();
    const out: MaterialCharacteristicOption[] = [];
    for (const m of this.materials()) {
      const chars = Array.isArray(m.characteristics) ? m.characteristics : [];
      for (const charName of chars) {
        const key = `${m.id}|${charName}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ materialId: m.id, materialName: m.name, charName });
        }
      }
    }
    out.sort((a, b) => (a.materialName + a.charName).localeCompare(b.materialName + b.charName));
    return out;
  });
  selectedCategoryIds = signal<string[]>([]);
  selectedArtistIds = signal<string[]>([]);
  selectedMaterialIds = signal<string[]>([]);
  selectedCharacteristicPairs = signal<{ materialId: string; charName: string }[]>([]);
  selectedAvailability = signal<string[]>([]);
  selectedSort = signal<'relevance' | 'price_low' | 'price_high'>('relevance');
  isLoading = signal(true);
  showFilters = signal(false);
  showSort = signal(false);
  expandedFilterGroups = signal<Record<string, boolean>>({
    categories: true,
    artists: false,
    material: false,
    characteristics: false,
    availability: false,
  });
  pageSize = signal(12);
  currentPage = signal(1);

  filteredProducts = computed(() => {
    let list = [...this.products()];

    const categoryIds = this.selectedCategoryIds();
    if (categoryIds.length > 0) {
      list = list.filter((product) => product.categories?.some((c) => categoryIds.includes(c.id)));
    }

    const artistIds = this.selectedArtistIds();
    if (artistIds.length > 0) {
      list = list.filter((product) => {
        const id = product.artist_id || product.vendor?.id || product.vendor_id;
        return id ? artistIds.includes(id) : false;
      });
    }

    const materialIds = this.selectedMaterialIds();
    if (materialIds.length > 0) {
      list = list.filter((product) => product.materials?.some((m) => materialIds.includes(m.id)));
    }

    const charPairs = this.selectedCharacteristicPairs();
    if (charPairs.length > 0) {
      list = list.filter((product) =>
        product.materials?.some((m) => {
          const chars = Array.isArray(m.characteristics) ? m.characteristics : [];
          return charPairs.some((p) => p.materialId === m.id && chars.includes(p.charName));
        }),
      );
    }

    const availability = this.selectedAvailability();
    if (availability.length > 0) {
      list = list.filter((product) => {
        const av = product.availability ?? 'in_stock';
        return availability.includes(av);
      });
    }

    const sort = this.selectedSort();
    if (sort === 'price_low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') list.sort((a, b) => b.price - a.price);

    // Siempre productos archivados al final
    list.sort(
      (a, b) =>
        ((a.status ?? 'approved') === 'archived' ? 1 : 0) -
        ((b.status ?? 'approved') === 'archived' ? 1 : 0),
    );
    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));

  pageNumbers = computed(() => {
    const total = this.totalPages();
    return total > 0 ? Array.from({ length: total }, (_, i) => i + 1) : [];
  });

  pagedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  constructor() {
    effect(() => {
      this.filteredProducts();
      this.currentPage.set(1);
    });
    this.updatePageSize();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadTechnique(slug);
        this.loadProducts(slug);
      }
    });

    this.productService.getCategories().subscribe({
      next: (categories) => this.categories.set(Array.isArray(categories) ? categories : []),
      error: () => this.categories.set([]),
    });

    this.productService.getMaterials().subscribe({
      next: (materials) => this.materials.set(Array.isArray(materials) ? materials : []),
      error: () => this.materials.set([]),
    });

    this.artistService.getArtists().subscribe({
      next: (artists) => this.artists.set(Array.isArray(artists) ? artists : []),
      error: () => this.artists.set([]),
    });
  }

  private loadTechnique(slug: string): void {
    this.productService.getTechniqueBySlug(slug).subscribe({
      next: (t) => this.technique.set(t),
      error: () => this.technique.set(null),
    });
  }

  private loadProducts(techniqueSlug: string): void {
    this.isLoading.set(true);
    this.productService.getProducts({ techniqueSlug }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
      },
    });
  }

  toggleCategory(id: string): void {
    this.toggleSelection(this.selectedCategoryIds, id);
  }

  toggleArtist(id: string): void {
    this.toggleSelection(this.selectedArtistIds, id);
  }

  toggleMaterial(id: string): void {
    this.toggleSelection(this.selectedMaterialIds, id);
  }

  toggleCharacteristic(materialId: string, charName: string): void {
    const list = this.selectedCharacteristicPairs();
    const idx = list.findIndex((p) => p.materialId === materialId && p.charName === charName);
    if (idx >= 0) {
      this.selectedCharacteristicPairs.set(list.filter((_, i) => i !== idx));
    } else {
      this.selectedCharacteristicPairs.set([...list, { materialId, charName }]);
    }
  }

  isCharacteristicSelected(materialId: string, charName: string): boolean {
    return this.selectedCharacteristicPairs().some(
      (p) => p.materialId === materialId && p.charName === charName,
    );
  }

  toggleAvailability(av: string): void {
    this.toggleSelection(this.selectedAvailability, av);
  }

  setSort(sort: 'relevance' | 'price_low' | 'price_high'): void {
    this.selectedSort.set(sort);
  }

  sortLabel(): string {
    const s = this.selectedSort();
    if (s === 'price_low') return 'Precio más bajo';
    if (s === 'price_high') return 'Precio más alto';
    return 'Más relevante';
  }

  setPage(page: number): void {
    const total = this.totalPages();
    if (total === 0) return;
    this.currentPage.set(Math.min(Math.max(page, 1), total));
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updatePageSize();
  }

  private updatePageSize(): void {
    if (typeof window === 'undefined') return;
    const next = window.innerWidth <= 1024 ? 10 : 12;
    if (this.pageSize() !== next) {
      this.pageSize.set(next);
      this.currentPage.set(1);
    }
  }

  private toggleSelection(sig: { (): string[]; set: (v: string[]) => void }, value: string): void {
    const list = sig();
    if (list.includes(value)) {
      sig.set(list.filter((x) => x !== value));
    } else {
      sig.set([...list, value]);
    }
  }

  clearFilters(): void {
    this.selectedCategoryIds.set([]);
    this.selectedArtistIds.set([]);
    this.selectedMaterialIds.set([]);
    this.selectedCharacteristicPairs.set([]);
    this.selectedAvailability.set([]);
    this.closeFilters();
    this.router.navigate(['/', this.localeService.getCurrentLocale(), 'products']);
  }

  openFilters(): void {
    this.showFilters.set(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
  }

  toggleSort(): void {
    this.showSort.set(!this.showSort());
  }

  closeSort(): void {
    this.showSort.set(false);
  }

  applyFilters(): void {
    this.closeFilters();
  }

  isFilterGroupExpanded(key: string): boolean {
    return !!this.expandedFilterGroups()[key];
  }

  toggleFilterGroup(key: string): void {
    const g = this.expandedFilterGroups();
    this.expandedFilterGroups.set({ ...g, [key]: !g[key] });
  }

  activeFilters(): string[] {
    const items: string[] = [];
    const t = this.technique();
    if (t) items.push(t.name);
    for (const id of this.selectedCategoryIds()) {
      const c = this.categories().find((x) => x.id === id);
      if (c) items.push(c.name);
    }
    for (const id of this.selectedArtistIds()) {
      const a = this.artists().find((x) => x.id === id);
      if (a) items.push(a.name);
    }
    for (const id of this.selectedMaterialIds()) {
      const m = this.materials().find((x) => x.id === id);
      if (m) items.push(m.name);
    }
    for (const p of this.selectedCharacteristicPairs()) {
      const m = this.materials().find((x) => x.id === p.materialId);
      items.push(m ? `${m.name} - ${p.charName}` : p.charName);
    }
    for (const av of this.selectedAvailability()) {
      if (av === 'in_stock') items.push('En stock');
      if (av === 'limited') items.push('Stock limitado');
      if (av === 'on_demand') items.push('Bajo demanda');
    }
    return items;
  }
}
