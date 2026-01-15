import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  featuredProducts = computed(() => this.products().slice(0, 4));
  ngOnInit(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3d6fb066-d5c2-417c-b90d-dfa24731bc3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'artist.ts:ngOnInit',message:'artist page init',data:{url:typeof window !== 'undefined' ? window.location?.href : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const artistId = this.route.snapshot.paramMap.get('id');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3d6fb066-d5c2-417c-b90d-dfa24731bc3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'artist.ts:ngOnInit',message:'artist route param',data:{artistId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (artistId) {
      this.loadArtist(artistId);
      this.loadArtistProducts(artistId);
    }
  }

  loadArtist(id: string): void {
    this.artistService.getArtist(id).subscribe({
      next: (artist) => {
        this.artist.set(artist);
        this.ensureArtistOnProducts();
        this.isLoading.set(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3d6fb066-d5c2-417c-b90d-dfa24731bc3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'artist.ts:loadArtist',message:'artist loaded',data:{artistId:id,name:artist?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      },
      error: (error) => {
        console.error('Error loading artist:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadArtistProducts(artistId: string): void {
    this.productService.getProductsByArtist(artistId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.ensureArtistOnProducts();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3d6fb066-d5c2-417c-b90d-dfa24731bc3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'artist.ts:loadArtistProducts',message:'artist products loaded',data:{artistId,count:products?.length ?? 0,firstName:products?.[0]?.vendor?.name ?? products?.[0]?.artist?.name ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      },
      error: (error) => console.error('Error loading artist products:', error),
    });
  }

  private ensureArtistOnProducts(): void {
    const artist = this.artist();
    if (!artist) {
      return;
    }
    const updated = this.products().map((product) =>
      product.vendor || product.artist ? product : { ...product, vendor: artist }
    );
    this.products.set(updated);
  }

  artistLocation(): string {
    const artist = this.artist();
    if (!artist) {
      return '';
    }
    const parts = [artist.city, artist.postal_code, artist.country].filter(Boolean);
    return parts.join(', ');
  }
}

