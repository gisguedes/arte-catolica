import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products';
import { LoginComponent } from './pages/login/login';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';
import { ArtistComponent } from './pages/artist/artist';
import { CartComponent } from './pages/cart/cart';
import { ProfileComponent } from './pages/profile/profile';
import { BuyerProfileComponent } from './pages/profile/buyer/buyer';
import { OrderDetailComponent } from './pages/profile/buyer/order-detail/order-detail';
import { SellerProfileComponent } from './pages/profile/seller/seller';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { CategoriesComponent } from './pages/categories/categories';
import { CategoryDetailComponent } from './pages/category-detail/category-detail';
import { TechniqueDetailComponent } from './pages/technique-detail/technique-detail';
import { TechniquesHubComponent } from './pages/techniques-hub/techniques-hub';
import { ArtistsComponent } from './pages/artists/artists';
import { AboutComponent } from './pages/about/about';
import { HealthComponent } from './features/health/health.component';
import { BecomeSellerComponent } from './pages/become-seller/become-seller';

export const routes: Routes = [
  { path: '', redirectTo: 'es/home', pathMatch: 'full' },
  { path: 'home', redirectTo: 'es/home', pathMatch: 'full' },
  { path: 'en', redirectTo: 'en/home', pathMatch: 'full' },
  { path: 'products', redirectTo: 'es/products', pathMatch: 'full' },
  { path: 'products/:id', redirectTo: 'es/products/:id', pathMatch: 'full' },
  { path: 'categories', redirectTo: 'es/categories', pathMatch: 'full' },
  { path: 'categories/:slug', redirectTo: 'es/categories/:slug', pathMatch: 'full' },
  { path: 'techniques', redirectTo: 'es/techniques', pathMatch: 'full' },
  { path: 'techniques/:slug', redirectTo: 'es/techniques/:slug', pathMatch: 'full' },
  { path: 'artists', redirectTo: 'es/artists', pathMatch: 'full' },
  { path: 'artists/:typeSlug', redirectTo: 'es/artists/:typeSlug', pathMatch: 'full' },
  { path: 'about', redirectTo: 'es/about', pathMatch: 'full' },
  { path: 'login', redirectTo: 'es/login', pathMatch: 'full' },
  { path: 'reset-password', redirectTo: 'es/reset-password', pathMatch: 'full' },
  { path: 'cart', redirectTo: 'es/cart', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'es/profile', pathMatch: 'full' },
  { path: 'profile/buyer', redirectTo: 'es/profile/buyer', pathMatch: 'full' },
  {
    path: 'profile/buyer/orders/:id',
    redirectTo: 'es/profile/buyer/orders/:id',
    pathMatch: 'full',
  },
  { path: 'profile/seller', redirectTo: 'es/profile/seller', pathMatch: 'full' },
  { path: 'ser-vendedor', redirectTo: 'es/ser-vendedor', pathMatch: 'full' },
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
      { path: 'categories/:slug', component: CategoryDetailComponent },
      { path: 'techniques', component: TechniquesHubComponent },
      { path: 'techniques/:slug', component: TechniqueDetailComponent },
      { path: 'artists', component: ArtistsComponent },
      { path: 'artists/:typeSlug', component: ArtistsComponent },
      { path: 'about', component: AboutComponent },
      { path: 'login', component: LoginComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'cart', component: CartComponent },
      { path: 'artist/:id', component: ArtistComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/buyer', component: BuyerProfileComponent },
      { path: 'profile/buyer/orders/:id', component: OrderDetailComponent },
      { path: 'profile/seller', component: SellerProfileComponent },
      { path: 'ser-vendedor', component: BecomeSellerComponent },
      { path: 'health', component: HealthComponent },
    ],
  },
  {
    path: 'en',
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ProductsComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'categories/:slug', component: CategoryDetailComponent },
      { path: 'techniques', component: TechniquesHubComponent },
      { path: 'techniques/:slug', component: TechniqueDetailComponent },
      { path: 'artists', component: ArtistsComponent },
      { path: 'artists/:typeSlug', component: ArtistsComponent },
      { path: 'about', component: AboutComponent },
      { path: 'login', component: LoginComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'cart', component: CartComponent },
      { path: 'artist/:id', component: ArtistComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/buyer', component: BuyerProfileComponent },
      { path: 'profile/buyer/orders/:id', component: OrderDetailComponent },
      { path: 'profile/seller', component: SellerProfileComponent },
      { path: 'ser-vendedor', component: BecomeSellerComponent },
      { path: 'health', component: HealthComponent },
    ],
  },
  { path: '**', redirectTo: 'es/home' },
];
