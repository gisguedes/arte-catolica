import { Component, signal, effect, inject } from '@angular/core';
import { NgIf, JsonPipe } from '@angular/common';
import { HealthService, HealthResponse } from '../../services/health.service';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [NgIf, JsonPipe],
  template: `
    <section class="p-4">
      <h1>API Health</h1>
      <p *ngIf="loading()">Cargando...</p>
      <pre *ngIf="!loading() && data()" class="p-3 bg-black/5 rounded">{{ data() | json }}</pre>
      <p *ngIf="!loading() && error()" class="text-red-600">Error: {{ error() }}</p>
    </section>
  `,
})
export class HealthComponent {
  loading = signal(true);
  data = signal<HealthResponse | null>(null);
  error = signal<string | null>(null);
  private api = inject(HealthService);

  constructor() {
    this.api.getHealth().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Unknown error');
        this.loading.set(false);
      },
    });
  }
}
