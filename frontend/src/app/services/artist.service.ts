import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Artist } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private apiService = inject(ApiService);

  getArtists(): Observable<Artist[]> {
    return this.apiService.get<{ data: Artist[] }>('vendors').pipe(
      map(response => response.data || response as any)
    );
  }

  getArtist(id: number): Observable<Artist> {
    return this.apiService.get<{ data: Artist }>(`vendors/${id}`).pipe(
      map(response => response.data || response as any)
    );
  }
}
