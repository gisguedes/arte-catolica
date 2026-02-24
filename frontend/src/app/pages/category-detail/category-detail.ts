import { Component, inject, OnInit, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './category-detail.html',
  styleUrl: './category-detail.scss',
})
export class CategoryDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  artists = signal<Artist[]>([]);
  materials = signal<Material[]>([]);
  techniques = signal<Technique[]>([]);

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
  products = signal<Product[]>([]);
  selectedCategoryIds = signal<string[]>([]);
  selectedTechniqueIds = signal<string[]>([]);
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
    techniques: false,
    availability: false,
  });
  pageSize = signal(12);
  currentPage = signal(1);

  currentCategory = computed(() => {
    const slug = this.route.snapshot.paramMap.get('slug');
    return this.categories().find((c) => c.slug === slug) ?? null;
  });

  filteredProducts = computed(() => {
    let list = [...this.products()];

    const categoryIds = this.selectedCategoryIds();
    if (categoryIds.length > 0) {
      list = list.filter((product) =>
        product.categories?.some((category) => categoryIds.includes(category.id)),
      );
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
      list = list.filter((product) =>
        product.materials?.some((material) => materialIds.includes(material.id)),
      );
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

    const techniqueIds = this.selectedTechniqueIds();
    if (techniqueIds.length > 0) {
      list = list.filter((product) => product.techniques?.some((t) => techniqueIds.includes(t.id)));
    }

    const availability = this.selectedAvailability();
    if (availability.length > 0) {
      list = list.filter((product) => {
        const productAvailability = product.availability ?? 'in_stock';
        return availability.includes(productAvailability);
      });
    }

    const sort = this.selectedSort();
    if (sort === 'price_low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_high') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));

  pageNumbers = computed(() => {
    const total = this.totalPages();
    return total > 0 ? Array.from({ length: total }, (_, index) => index + 1) : [];
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
      this.applyCategorySlug(slug);
    });

    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(Array.isArray(categories) ? categories : []);
        this.applyCategorySlug(this.route.snapshot.paramMap.get('slug'));
      },
      error: () => this.categories.set([]),
    });

    this.artistService.getArtists().subscribe({
      next: (artists) => this.artists.set(Array.isArray(artists) ? artists : []),
      error: () => this.artists.set([]),
    });

    this.productService.getTechniques().subscribe({
      next: (techniques) => this.techniques.set(Array.isArray(techniques) ? techniques : []),
      error: () => this.techniques.set([]),
    });

    this.productService.getMaterials().subscribe({
      next: (materials) => this.materials.set(Array.isArray(materials) ? materials : []),
      error: () => this.materials.set([]),
    });

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(Array.isArray(products) ? products : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private applyCategorySlug(slug: string | null): void {
    if (!slug) return;
    const category = this.categories().find((item) => item.slug === slug);
    if (category) {
      this.selectedCategoryIds.set([category.id]);
    }
  }

  toggleCategory(categoryId: string): void {
    this.toggleSelection(this.selectedCategoryIds, categoryId);
  }

  toggleArtist(artistId: string): void {
    this.toggleSelection(this.selectedArtistIds, artistId);
  }

  toggleMaterial(materialId: string): void {
    this.toggleSelection(this.selectedMaterialIds, materialId);
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

  toggleTechnique(techniqueId: string): void {
    this.toggleSelection(this.selectedTechniqueIds, techniqueId);
  }

  toggleAvailability(availability: string): void {
    this.toggleSelection(this.selectedAvailability, availability);
  }

  setSort(sort: 'relevance' | 'price_low' | 'price_high'): void {
    this.selectedSort.set(sort);
  }

  sortLabel(): string {
    const sort = this.selectedSort();
    if (sort === 'price_low') return 'Precio más bajo';
    if (sort === 'price_high') return 'Precio más alto';
    return 'Más relevante';
  }

  setPage(page: number): void {
    const total = this.totalPages();
    if (total === 0) {
      this.currentPage.set(1);
      return;
    }
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

  private toggleSelection(
    listSignal: { (): string[]; set: (value: string[]) => void },
    value: string,
  ): void {
    const list = listSignal();
    if (list.includes(value)) {
      listSignal.set(list.filter((item) => item !== value));
    } else {
      listSignal.set([...list, value]);
    }
  }

  clearFilters(): void {
    this.selectedCategoryIds.set([]);
    this.selectedArtistIds.set([]);
    this.selectedMaterialIds.set([]);
    this.selectedCharacteristicPairs.set([]);
    this.selectedTechniqueIds.set([]);
    this.selectedAvailability.set([]);
    this.closeFilters();
    this.router.navigate(['/es', 'products']);
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
    const slug = this.route.snapshot.paramMap.get('slug');
    const categoryIds = this.selectedCategoryIds();

    for (const categoryId of categoryIds) {
      const cat = this.categories().find((c) => c.id === categoryId);
      if (cat) items.push(cat.name);
    }

    for (const techniqueId of this.selectedTechniqueIds()) {
      const tech = this.techniques().find((t) => t.id === techniqueId);
      if (tech) items.push(tech.name);
    }

    for (const artistId of this.selectedArtistIds()) {
      const artist = this.artists().find((a) => a.id === artistId);
      if (artist) items.push(artist.name);
    }

    for (const materialId of this.selectedMaterialIds()) {
      const material = this.materials().find((m) => m.id === materialId);
      if (material) items.push(material.name);
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
