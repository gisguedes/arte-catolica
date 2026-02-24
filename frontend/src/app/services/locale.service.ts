import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Locale, translations } from '../i18n/translations';

const STORAGE_KEY = 'arte-catolica-locale';

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private router = inject(Router);

  private _locale = signal<Locale>(this.loadStoredLocale());

  locale = this._locale.asReadonly();
  isEnglish = computed(() => this._locale() === 'en');
  isSpanish = computed(() => this._locale() === 'es');

  getCurrentLocale(): Locale {
    return this._locale();
  }

  translate(key: string): string {
    const loc = this._locale();
    const dict = translations[loc];
    const fallback = translations['es'];
    return dict[key] ?? fallback[key] ?? key;
  }

  setLocale(locale: Locale): void {
    this._locale.set(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    this.navigateToLocale(locale);
  }

  /** Switch to equivalent path with new locale prefix (e.g. /es/products -> /en/products) */
  navigateToLocale(locale: Locale): void {
    const url = this.router.url;
    const match = url.match(/^\/(es|en)(\/.*)?$/);
    if (match) {
      const path = match[2] ?? '/home';
      this.router.navigateByUrl(`/${locale}${path}`);
    } else {
      this.router.navigate(['/', locale, 'home']);
    }
  }

  /** Get locale from current URL or stored preference */
  getLocaleFromUrl(): Locale {
    const url = this.router.url;
    return url.startsWith('/en') ? 'en' : 'es';
  }

  /** Sync locale signal with URL (call on init / route change) */
  syncFromUrl(): void {
    const urlLocale = this.getLocaleFromUrl();
    if (urlLocale !== this._locale()) {
      this._locale.set(urlLocale);
      try {
        localStorage.setItem(STORAGE_KEY, urlLocale);
      } catch {
        /* ignore */
      }
    }
  }

  private loadStoredLocale(): Locale {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {
      /* ignore */
    }
    return 'es';
  }
}
