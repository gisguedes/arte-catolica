import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api';
import { Artist } from '../models/product.model';
import type { VendorUserRole } from '../constants/vendor-roles';

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

  updateVendorStatus(vendorId: string, status: string): Observable<{ data: Artist }> {
    return this.apiService.patch<{ data: Artist }>(`vendors/${vendorId}/status`, { status });
  }

  updateVendor(
    vendorId: string,
    payload: Partial<
      Artist & { short_description?: string; description?: string; preparation_days?: number }
    >,
  ): Observable<{ data: Artist }> {
    return this.apiService.patch<{ data: Artist }>(`vendors/${vendorId}`, payload);
  }

  getVendorUsers(vendorId: string): Observable<{ data: VendorUser[] }> {
    return this.apiService.get<{ data: VendorUser[] }>(`vendors/${vendorId}/users`);
  }

  addVendorUser(
    vendorId: string,
    email: string,
    role: VendorUserRole,
  ): Observable<{ data: VendorUser }> {
    return this.apiService.post<{ data: VendorUser }>(`vendors/${vendorId}/users`, {
      email: email.trim(),
      role,
    });
  }

  removeVendorUser(vendorId: string, userId: string): Observable<void> {
    return this.apiService.delete<void>(`vendors/${vendorId}/users/${userId}`);
  }

  getCompany(vendorId: string): Observable<Company | null> {
    return this.apiService
      .get<{ data: Company | null }>(`vendors/${vendorId}/company`)
      .pipe(map((res) => res.data ?? null));
  }

  updateCompany(vendorId: string, payload: Partial<Company>): Observable<{ data: Company }> {
    return this.apiService.put<{ data: Company }>(`vendors/${vendorId}/company`, payload);
  }
}

export interface Company {
  id?: string;
  vendor_id?: string;
  legal_name?: string | null;
  nif?: string | null;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VendorUser {
  id: string;
  user_id: string;
  role: VendorUserRole;
  created_at?: string;
  name?: string;
  surname?: string;
  email?: string;
}
