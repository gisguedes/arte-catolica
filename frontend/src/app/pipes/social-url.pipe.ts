import { Pipe, PipeTransform } from '@angular/core';

const SOCIAL_BASE_URLS: Record<string, string> = {
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  facebook: 'https://facebook.com/',
  twitter: 'https://x.com/',
  youtube: 'https://youtube.com/',
  linkedin: 'https://linkedin.com/in/',
  pinterest: 'https://pinterest.com/',
};

@Pipe({
  name: 'socialUrl',
  standalone: true,
})
export class SocialUrlPipe implements PipeTransform {
  transform(value: string | null | undefined, platform: string): string {
    if (!value || typeof value !== 'string') return '#';
    const trimmed = value.trim();
    if (!trimmed) return '#';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const handle = trimmed.replace(/^@/, '');
    const baseUrl = SOCIAL_BASE_URLS[platform?.toLowerCase()];
    return baseUrl ? baseUrl + handle : trimmed;
  }
}
