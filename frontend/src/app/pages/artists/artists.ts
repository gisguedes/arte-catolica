import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ArtistService } from '../../services/artist.service';
import { Artist, ArtistType } from '../../models/product.model';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './artists.html',
  styleUrl: './artists.scss',
})
export class ArtistsComponent implements OnInit {
  private artistService = inject(ArtistService);
  private route = inject(ActivatedRoute);

  artists = signal<Artist[]>([]);
  artistTypes = signal<ArtistType[]>([]);
  selectedTypeId = signal<string | null>(null);
  isLoading = signal(true);

  currentType = computed(() => {
    const id = this.selectedTypeId();
    return id ? (this.artistTypes().find((t) => t.id === id) ?? null) : null;
  });

  filteredArtists = computed(() => {
    const typeId = this.selectedTypeId();
    const list = this.artists();

    if (!typeId) return list;

    return list.filter((artist) => artist.artist_types?.some((t) => t.id === typeId));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('typeSlug');
      const types = this.artistTypes();
      if (!slug) {
        this.selectedTypeId.set(null);
        return;
      }
      const type = types.find((t) => t.slug === slug);
      this.selectedTypeId.set(type?.id ?? null);
    });

    this.artistService.getArtistTypes().subscribe({
      next: (types) => {
        this.artistTypes.set(Array.isArray(types) ? types : []);
        this.applyTypeFromRoute();
      },
      error: () => this.artistTypes.set([]),
    });

    this.artistService.getArtists().subscribe({
      next: (artists) => {
        this.artists.set(Array.isArray(artists) ? artists : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.artists.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private applyTypeFromRoute(): void {
    const slug = this.route.snapshot.paramMap.get('typeSlug');
    if (!slug) {
      this.selectedTypeId.set(null);
      return;
    }
    const type = this.artistTypes().find((t) => t.slug === slug);
    this.selectedTypeId.set(type?.id ?? null);
  }

  isTypeSelected(typeId: string): boolean {
    return this.selectedTypeId() === typeId;
  }

  getTypeIcon(alias: string | undefined): string {
    if (!alias) return 'sculptor';
    const icons: Record<string, string> = {
      sculptor: 'sculptor',
      painter: 'painter',
      iconographer: 'iconographer',
      goldsmith: 'goldsmith',
      illustrator: 'illustrator',
      'textile-artisan': 'textile',
    };
    return icons[alias] ?? 'sculptor';
  }
}
