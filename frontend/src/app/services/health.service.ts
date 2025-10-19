import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type HealthResponse = {
  name: string;
  env: string;
  version: string;
  checks: { app: boolean; db: boolean };
  timestamp: string;
};

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getHealth() {
    return this.http.get<HealthResponse>(`${this.base}/health`);
  }
}
