import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { LocaleService } from '../../services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Technique } from '../../models/product.model';

@Component({
  selector: 'app-techniques-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './techniques-hub.html',
  styleUrl: './techniques-hub.scss',
})
export class TechniquesHubComponent implements OnInit {
  private productService = inject(ProductService);
  private localeService = inject(LocaleService);

  locale = this.localeService.locale;

  techniques = signal<Technique[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.productService.getTechniques().subscribe({
      next: (techniques) => {
        this.techniques.set(Array.isArray(techniques) ? techniques : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.techniques.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
