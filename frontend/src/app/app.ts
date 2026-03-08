import { Component, OnDestroy, inject, signal, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { FavoritesService } from './services/favorites.service';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { LocaleService } from './services/locale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnDestroy {
  protected readonly title = signal('Arte Católica');
  private readonly destroy$ = new Subject<void>();

  private localeService = inject(LocaleService);
  private authService = inject(AuthService);
  private favoritesService = inject(FavoritesService);

  private loadFavoritesEffect = effect(() => {
    const u = this.authService.user();
    if (u?.id) this.favoritesService.loadFavorites();
  });

  constructor(
    private readonly router: Router,
    private readonly viewportScroller: ViewportScroller,
  ) {
    this.localeService.syncFromUrl();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.localeService.syncFromUrl();
        this.viewportScroller.scrollToPosition([0, 0]);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
