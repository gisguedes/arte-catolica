import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  const localeService = inject(LocaleService);
  const locale = localeService.getCurrentLocale();

  req = req.clone({
    setHeaders: {
      'Accept-Language': locale,
    },
  });

  return next(req);
};
