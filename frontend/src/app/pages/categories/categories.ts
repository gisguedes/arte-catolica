import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ArtistService } from '../../services/artist.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { Category, Artist, Product, Material } from '../../models/product.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesComponent implements OnInit {
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);
  private route = inject(ActivatedRoute);

  categories = signal<Category[]>([]);
  artists = signal<Artist[]>([]);
  materials = signal<Material[]>([]);
  products = signal<Product[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedCategorySlug = signal<string | null>(null);
  selectedArtistId = signal<string | null>(null);
  selectedMaterialId = signal<string | null>(null);
  selectedAvailability = signal<string | null>(null);
  selectedSort = signal<'relevance' | 'price_low' | 'price_high'>('relevance');
  isLoading = signal(true);

  filteredProducts = computed(() => {
    let list = [...this.products()];

    const categoryId = this.selectedCategoryId();
    if (categoryId) {
      list = list.filter((product) =>
        product.categories?.some((category) => category.id === categoryId)
      );
    }

    const artistId = this.selectedArtistId();
    if (artistId) {
      list = list.filter((product) => {
        const id = product.artist_id || product.vendor?.id || product.vendor_id;
        return id === artistId;
      });
    }

    const materialId = this.selectedMaterialId();
    if (materialId) {
      list = list.filter((product) =>
        product.materials?.some((material) => material.id === materialId)
      );
    }

    const availability = this.selectedAvailability();
    if (availability) {
      list = list.filter((product) => {
        const productAvailability = product.availability ?? 'in_stock';
        if (availability === 'in_stock') {
          return productAvailability === 'in_stock';
        }
        return productAvailability === availability;
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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const categorySlug = params['category_slug'] ?? null;
      this.selectedCategorySlug.set(categorySlug);
      this.applyCategorySlug();
    });

    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(Array.isArray(categories) ? categories : []);
        this.applyCategorySlug();
      },
      error: () => {
        this.categories.set([]);
      },
    });

    this.artistService.getArtists().subscribe({
      next: (artists) => {
        this.artists.set(Array.isArray(artists) ? artists : []);
      },
      error: () => {
        this.artists.set([]);
      },
    });

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(Array.isArray(products) ? products : []);
        const materials = new Map<string, Material>();
        for (const product of this.products()) {
          for (const material of product.materials ?? []) {
            materials.set(material.id, material);
          }
        }
        this.materials.set([...materials.values()]);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
      },
    });
  }

  applyCategorySlug(): void {
    const categorySlug = this.selectedCategorySlug();
    if (!categorySlug) {
      return;
    }
    const category = this.categories().find((item) => item.slug === categorySlug);
    if (category) {
      this.selectedCategoryId.set(category.id);
    }
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  filterByArtist(artistId: string | null): void {
    this.selectedArtistId.set(artistId);
  }

  filterByMaterial(materialId: string | null): void {
    this.selectedMaterialId.set(materialId);
  }

  filterByAvailability(availability: string | null): void {
    this.selectedAvailability.set(availability);
  }

  setSort(sort: 'relevance' | 'price_low' | 'price_high'): void {
    this.selectedSort.set(sort);
  }

  clearFilters(): void {
    this.selectedCategoryId.set(null);
    this.selectedCategorySlug.set(null);
    this.selectedArtistId.set(null);
    this.selectedMaterialId.set(null);
    this.selectedAvailability.set(null);
    this.selectedSort.set('relevance');
  }
}

