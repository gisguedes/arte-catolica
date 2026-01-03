import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  image?: string;
  link?: string;
}

@Component({
  selector: 'app-news-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-carousel.html',
  styleUrl: './news-carousel.scss',
})
export class NewsCarouselComponent {
  @Input() news: NewsItem[] = [];
  
  currentIndex = signal(0);

  next(): void {
    if (this.news.length > 0) {
      this.currentIndex.set((this.currentIndex() + 1) % this.news.length);
    }
  }

  prev(): void {
    if (this.news.length > 0) {
      this.currentIndex.set(
        this.currentIndex() === 0 ? this.news.length - 1 : this.currentIndex() - 1
      );
    }
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }
}

