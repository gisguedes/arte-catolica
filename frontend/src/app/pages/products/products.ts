import { Component, inject, OnInit, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ArtistService } from '../../services/artist.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { NewsCarouselComponent } from '../../components/news-carousel/news-carousel';
import {
  Product,
  Category,
  Artist,
  Material,
  Technique,
  MaterialCharacteristicOption,
  ArtistType,
} from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, NewsCarouselComponent],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  featuredArtists = signal<Artist[]>([]);
  artists = signal<Artist[]>([]);
  materials = signal<Material[]>([]);
  techniques = signal<Technique[]>([]);
  artistTypes = signal<ArtistType[]>([]);

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
  selectedTypeIds = signal<string[]>([]);
  selectedTechniqueIds = signal<string[]>([]);
  selectedCategorySlug = signal<string | null>(null);
  selectedArtistIds = signal<string[]>([]);
  selectedMaterialIds = signal<string[]>([]);
  selectedCharacteristicPairs = signal<{ materialId: string; charName: string }[]>([]);
  selectedAvailability = signal<string[]>([]);
  selectedSort = signal<'relevance' | 'price_low' | 'price_high'>('relevance');
  isLoading = signal(true);
  isHome = signal(true);
  showFilters = signal(false);
  showSort = signal(false);
  expandedFilterGroups = signal<Record<string, boolean>>({
    categories: true,
    type: false,
    artists: false,
    techniques: false,
    materialAndCharacteristics: false,
    availability: false,
  });
  pageSize = signal(12);
  currentPage = signal(1);

  newsItems = signal([
    {
      id: 1,
      title: 'Nueva Colección de Arte Sacro',
      description: 'Descubre las últimas obras de nuestros artistas más destacados',
      link: '/es/products',
    },
    {
      id: 2,
      title: 'Guía de Categorías',
      description: 'Explora nuevas categorías y descubre piezas únicas',
      link: '/es/categories',
    },
    {
      id: 3,
      title: 'Artistas Consagrados',
      description: 'Conoce a los artistas detrás de cada obra',
      link: '/es/artists',
    },
  ]);

  filteredProducts = computed(() => {
    let list = [...this.products()];

    const categoryIds = this.selectedCategoryIds();
    if (categoryIds.length > 0) {
      list = list.filter((product) =>
        product.categories?.some((category) => categoryIds.includes(category.id)),
      );
    }

    const typeIds = this.selectedTypeIds();
    if (typeIds.length > 0) {
      list = list.filter((product) => {
        const vendor = product.vendor ?? product.artist;
        return vendor?.artist_types?.some((t) => typeIds.includes(t.id)) ?? false;
      });
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
    this.isHome.set(this.router.url.includes('/es/home'));
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHome.set(event.urlAfterRedirects.includes('/es/home'));
      }
    });

    // Escuchar cambios en query params
    this.route.queryParams.subscribe((params) => {
      const categorySlug = params['category_slug'] ?? null;
      this.selectedCategorySlug.set(categorySlug);
      this.applyCategorySlug();
    });

    this.loadCategories();
    this.loadFeaturedArtists();
    this.loadArtists();
    this.loadArtistTypes();
    this.loadTechniques();
    this.loadMaterials();
    this.loadProducts();
  }

  loadArtistTypes(): void {
    this.artistService.getArtistTypes().subscribe({
      next: (types) => this.artistTypes.set(Array.isArray(types) ? types : []),
      error: () => this.artistTypes.set([]),
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(Array.isArray(categories) ? categories : []);
        this.applyCategorySlug();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories.set([]);
      },
    });
  }

  loadFeaturedArtists(): void {
    this.artistService.getArtists().subscribe({
      next: (artists) => {
        this.featuredArtists.set(Array.isArray(artists) ? artists.slice(0, 6) : []);
      },
      error: (error) => {
        console.error('Error loading artists:', error);
        this.featuredArtists.set([]);
      },
    });
  }

  loadArtists(): void {
    this.artistService.getArtists().subscribe({
      next: (artists) => {
        this.artists.set(Array.isArray(artists) ? artists : []);
      },
      error: () => {
        this.artists.set([]);
      },
    });
  }

  loadTechniques(): void {
    this.productService.getTechniques().subscribe({
      next: (techniques) => {
        this.techniques.set(Array.isArray(techniques) ? techniques : []);
      },
      error: () => {
        this.techniques.set([]);
      },
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(Array.isArray(products) ? products : []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products.set([]);
        this.isLoading.set(false);
      },
    });
  }

  loadMaterials(): void {
    this.productService.getMaterials().subscribe({
      next: (materials) => {
        this.materials.set(Array.isArray(materials) ? materials : []);
      },
      error: () => this.materials.set([]),
    });
  }

  applyCategorySlug(): void {
    const categorySlug = this.selectedCategorySlug();
    if (!categorySlug) {
      return;
    }
    const category = this.categories().find((item) => item.slug === categorySlug);
    if (category) {
      this.addSelection(this.selectedCategoryIds, category.id);
    }
  }

  toggleCategory(categoryId: string): void {
    this.toggleSelection(this.selectedCategoryIds, categoryId);
  }

  clearFilter(): void {
    this.selectedCategoryIds.set([]);
    this.selectedCategorySlug.set(null);
    this.selectedTypeIds.set([]);
    this.selectedArtistIds.set([]);
    this.selectedMaterialIds.set([]);
    this.selectedCharacteristicPairs.set([]);
    this.selectedTechniqueIds.set([]);
    this.selectedAvailability.set([]);
    this.selectedSort.set('relevance');
    this.closeFilters();
  }

  toggleArtist(artistId: string): void {
    this.toggleSelection(this.selectedArtistIds, artistId);
  }

  toggleType(typeId: string): void {
    this.toggleSelection(this.selectedTypeIds, typeId);
  }

  toggleMaterial(materialId: string): void {
    const material = this.materials().find((m) => m.id === materialId);
    const chars = material
      ? Array.isArray(material.characteristics)
        ? material.characteristics
        : []
      : [];
    const isSelected = this.selectedMaterialIds().includes(materialId);
    if (isSelected) {
      this.selectedMaterialIds.set(this.selectedMaterialIds().filter((id) => id !== materialId));
      this.selectedCharacteristicPairs.set(
        this.selectedCharacteristicPairs().filter((p) => p.materialId !== materialId),
      );
    } else {
      this.selectedMaterialIds.set([...this.selectedMaterialIds(), materialId]);
      const pairs = [...this.selectedCharacteristicPairs()];
      for (const charName of chars) {
        if (!pairs.some((p) => p.materialId === materialId && p.charName === charName)) {
          pairs.push({ materialId, charName });
        }
      }
      this.selectedCharacteristicPairs.set(pairs);
    }
  }

  toggleCharacteristic(materialId: string, charName: string): void {
    const list = this.selectedCharacteristicPairs();
    const key = `${materialId}|${charName}`;
    const idx = list.findIndex((p) => p.materialId === materialId && p.charName === charName);
    if (idx >= 0) {
      this.selectedCharacteristicPairs.set(list.filter((_, i) => i !== idx));
    } else {
      this.selectedCharacteristicPairs.set([...list, { materialId, charName }]);
    }
  }

  isFilterGroupExpanded(key: string): boolean {
    return !!this.expandedFilterGroups()[key];
  }

  toggleFilterGroup(key: string): void {
    const g = this.expandedFilterGroups();
    this.expandedFilterGroups.set({ ...g, [key]: !g[key] });
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
    const next = Math.min(Math.max(page, 1), total);
    this.currentPage.set(next);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updatePageSize();
  }

  private updatePageSize(): void {
    if (typeof window === 'undefined') {
      this.pageSize.set(12);
      return;
    }
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
      return;
    }
    listSignal.set([...list, value]);
  }

  private addSelection(
    listSignal: { (): string[]; set: (value: string[]) => void },
    value: string,
  ): void {
    const list = listSignal();
    if (!list.includes(value)) {
      listSignal.set([...list, value]);
    }
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

  activeFilters(): string[] {
    const items: string[] = [];

    for (const categoryId of this.selectedCategoryIds()) {
      const category = this.categories().find((item) => item.id === categoryId);
      if (category) items.push(category.name);
    }

    for (const typeId of this.selectedTypeIds()) {
      const t = this.artistTypes().find((item) => item.id === typeId);
      if (t) items.push(t.name);
    }

    for (const artistId of this.selectedArtistIds()) {
      const artist = this.artists().find((item) => item.id === artistId);
      if (artist) items.push(artist.name);
    }

    for (const techniqueId of this.selectedTechniqueIds()) {
      const technique = this.techniques().find((item) => item.id === techniqueId);
      if (technique) items.push(technique.name);
    }

    for (const materialId of this.selectedMaterialIds()) {
      const material = this.materials().find((item) => item.id === materialId);
      if (material) items.push(material.name);
    }

    for (const p of this.selectedCharacteristicPairs()) {
      const m = this.materials().find((x) => x.id === p.materialId);
      items.push(m ? `${m.name} - ${p.charName}` : p.charName);
    }

    for (const availability of this.selectedAvailability()) {
      if (availability === 'in_stock') items.push('En stock');
      if (availability === 'limited') items.push('Stock limitado');
      if (availability === 'on_demand') items.push('Bajo demanda');
    }

    return items;
  }
}
