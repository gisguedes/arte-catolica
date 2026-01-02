import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArtistService } from '../../services/artist.service';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { Artist, Product } from '../../models/product.model';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
})
export class ArtistComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private artistService = inject(ArtistService);
  private productService = inject(ProductService);

  artist = signal<Artist | null>(null);
  products = signal<Product[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    const artistId = this.route.snapshot.paramMap.get('id');
    if (artistId) {
      this.loadArtist(+artistId);
      this.loadArtistProducts(+artistId);
    }
  }

  loadArtist(id: number): void {
    this.artistService.getArtist(id).subscribe({
      next: (artist) => {
        this.artist.set(artist);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading artist:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadArtistProducts(artistId: number): void {
    this.productService.getProductsByArtist(artistId).subscribe({
      next: (products) => this.products.set(products),
      error: (error) => console.error('Error loading artist products:', error),
    });
  }
}

