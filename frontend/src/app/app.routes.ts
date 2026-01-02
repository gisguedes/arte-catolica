import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products';
import { LoginComponent } from './pages/login/login';
import { ArtistComponent } from './pages/artist/artist';
import { CartComponent } from './pages/cart/cart';
import { HealthComponent } from './features/health/health.component';

export const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cart', component: CartComponent },
  { path: 'artist/:id', component: ArtistComponent },
  { path: 'health', component: HealthComponent },
  { path: '**', redirectTo: '' },
];
