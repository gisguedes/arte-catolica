import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Artist, ArtistType } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private apiService = inject(ApiService);

  getArtistTypes(): Observable<ArtistType[]> {
    return this.apiService
      .get<{ data: ArtistType[] }>('artist-types')
      .pipe(map((response) => response.data || (response as any)));
  }

  getArtists(): Observable<Artist[]> {
    return this.apiService
      .get<{ data: Artist[] }>('vendors')
      .pipe(map((response) => response.data || (response as any)));
  }

  getArtist(id: string): Observable<Artist> {
    return this.apiService
      .get<{ data: Artist }>(`vendors/${id}`)
      .pipe(map((response) => response.data || (response as any)));
  }
}
