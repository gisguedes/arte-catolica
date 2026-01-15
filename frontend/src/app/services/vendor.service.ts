import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Artist } from '../models/product.model';

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
}
