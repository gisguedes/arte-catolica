import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ArtistService } from '../../services/artist.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { NewsCarouselComponent } from '../../components/news-carousel/news-carousel';
import { Product, Category, Artist } from '../../models/product.model';

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

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  featuredArtists = signal<Artist[]>([]);
  selectedCategoryId = signal<number | null>(null);
  isLoading = signal(true);

  newsItems = signal([
    {
      id: 1,
      title: 'Nueva Colección de Arte Sacro',
      description: 'Descubre las últimas obras de nuestros artistas más destacados',
      link: '/products',
    },
  ]);

  ngOnInit(): void {
    // Escuchar cambios en query params
    this.route.queryParams.subscribe(params => {
      const categoryId = params['category_id'] ? +params['category_id'] : null;
      if (categoryId) {
        this.filterByCategory(categoryId);
      } else {
        this.loadProducts();
      }
    });

    this.loadCategories();
    this.loadFeaturedArtists();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(Array.isArray(categories) ? categories : []);
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

  loadProducts(categoryId?: number): void {
    this.isLoading.set(true);
    this.selectedCategoryId.set(categoryId || null);
    this.productService.getProducts(categoryId).subscribe({
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

  filterByCategory(categoryId: number | null): void {
    this.loadProducts(categoryId || undefined);
  }

  clearFilter(): void {
    this.loadProducts();
  }
}
