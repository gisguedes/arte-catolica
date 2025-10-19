import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  name: string;
  env: string;
  version: string;
  checks: { app: boolean; db?: boolean };
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);
  get(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>('/api/health');
  }
}
