import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { Artist } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private apiService = inject(ApiService);

  getArtists(): Observable<Artist[]> {
    return this.apiService.get<Artist[]>('artists');
  }

  getArtist(id: number): Observable<Artist> {
    return this.apiService.get<Artist>(`artists/${id}`);
  }
}

