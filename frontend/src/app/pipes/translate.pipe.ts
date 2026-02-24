import { Pipe, PipeTransform, inject, ChangeDetectorRef } from '@angular/core';
import { LocaleService } from '../services/locale.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private locale = inject(LocaleService);
  private cdr = inject(ChangeDetectorRef);

  transform(key: string): string {
    this.locale.locale(); // subscribe to locale changes
    this.cdr.markForCheck();
    return this.locale.translate(key);
  }
}
