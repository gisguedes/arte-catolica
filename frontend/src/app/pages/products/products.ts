import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ArtistService } from '../../services/artist.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { NewsCarouselComponent } from '../../components/news-carousel/news-carousel';
import { Product, Category, Artist, Material } from '../../models/product.model';

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
  selectedCategoryId = signal<string | null>(null);
  selectedCategorySlug = signal<string | null>(null);
  selectedArtistId = signal<string | null>(null);
  selectedMaterialId = signal<string | null>(null);
  selectedAvailability = signal<string | null>(null);
  selectedSort = signal<'relevance' | 'price_low' | 'price_high'>('relevance');
  isLoading = signal(true);
  isHome = signal(true);

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
    this.isHome.set(this.router.url.includes('/es/home'));
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHome.set(event.urlAfterRedirects.includes('/es/home'));
      }
    });

    // Escuchar cambios en query params
    this.route.queryParams.subscribe(params => {
      const categorySlug = params['category_slug'] ?? null;
      this.selectedCategorySlug.set(categorySlug);
      this.applyCategorySlug();
    });

    this.loadCategories();
    this.loadFeaturedArtists();
    this.loadArtists();
    this.loadProducts();
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

  loadProducts(): void {
    this.isLoading.set(true);
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
      error: (error) => {
        console.error('Error loading products:', error);
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

  filterByCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  clearFilter(): void {
    this.selectedCategoryId.set(null);
    this.selectedCategorySlug.set(null);
    this.selectedArtistId.set(null);
    this.selectedMaterialId.set(null);
    this.selectedAvailability.set(null);
    this.selectedSort.set('relevance');
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
}
