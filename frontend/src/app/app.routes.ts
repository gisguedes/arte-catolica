import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products';
import { LoginComponent } from './pages/login/login';
import { ArtistComponent } from './pages/artist/artist';
import { CartComponent } from './pages/cart/cart';
import { ProfileComponent } from './pages/profile/profile';
import { BuyerProfileComponent } from './pages/profile/buyer/buyer';
import { SellerProfileComponent } from './pages/profile/seller/seller';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { CategoriesComponent } from './pages/categories/categories';
import { ArtistsComponent } from './pages/artists/artists';
import { HealthComponent } from './features/health/health.component';

export const routes: Routes = [
  { path: '', redirectTo: 'es/home', pathMatch: 'full' },
  { path: 'home', redirectTo: 'es/home', pathMatch: 'full' },
  { path: 'products', redirectTo: 'es/products', pathMatch: 'full' },
  { path: 'products/:id', redirectTo: 'es/products/:id', pathMatch: 'full' },
  { path: 'categories', redirectTo: 'es/categories', pathMatch: 'full' },
  { path: 'artists', redirectTo: 'es/artists', pathMatch: 'full' },
  { path: 'login', redirectTo: 'es/login', pathMatch: 'full' },
  { path: 'cart', redirectTo: 'es/cart', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'es/profile', pathMatch: 'full' },
  { path: 'profile/buyer', redirectTo: 'es/profile/buyer', pathMatch: 'full' },
  { path: 'profile/seller', redirectTo: 'es/profile/seller', pathMatch: 'full' },
  { path: 'artist/:id', redirectTo: 'es/artist/:id', pathMatch: 'full' },
  { path: 'health', redirectTo: 'es/health', pathMatch: 'full' },
  {
    path: 'es',
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ProductsComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'artists', component: ArtistsComponent },
      { path: 'login', component: LoginComponent },
      { path: 'cart', component: CartComponent },
      { path: 'artist/:id', component: ArtistComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/buyer', component: BuyerProfileComponent },
      { path: 'profile/seller', component: SellerProfileComponent },
      { path: 'health', component: HealthComponent },
    ],
  },
  { path: '**', redirectTo: 'es/home' },
];
