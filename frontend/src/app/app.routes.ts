import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { HealthComponent } from './features/health/health.component';

export const routes: Routes = [
  { path: '', redirectTo: 'health', pathMatch: 'full' },
  { path: 'health', component: HealthComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '' },
];
