import { Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  private localeService = inject(LocaleService);
  private viewportScroller = inject(ViewportScroller);

  locale = this.localeService.locale;
  currentYear = new Date().getFullYear();

  scrollToTop(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.viewportScroller.scrollToPosition([0, 0]);
  }
}
