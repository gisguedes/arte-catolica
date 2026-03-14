import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Artist } from '../models/product.model';

export interface CreateVendorPayload {
  name: string;
  surname: string;
  phone?: string;
  nif?: string;
  artist_type_ids?: string[];
  short_description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private apiService = inject(ApiService);

  getVendorByUserId(userId: string): Observable<Artist | null> {
    return this.apiService.get<{ data: Artist[] }>(`vendors?user_id=${userId}`).pipe(
      map((response) => {
        const vendors = response.data || (response as any);
        return Array.isArray(vendors) ? (vendors[0] ?? null) : null;
      }),
    );
  }

  createVendor(payload: CreateVendorPayload): Observable<{ data: Artist }> {
    return this.apiService.post<{ data: Artist }>('vendors', payload);
  }
}
