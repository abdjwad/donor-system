import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentLang = signal<AppLanguage>('ar');

  init(): void {
    const saved = this.getSavedLanguage();
    this.setLanguage(saved);
  }

  setLanguage(lang: AppLanguage): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app_lang', lang);
    }
  }

  toggle(): void {
    const next: AppLanguage = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.setLanguage(next);
  }

  isRtl(): boolean {
    return this.currentLang() === 'ar';
  }

  private getSavedLanguage(): AppLanguage {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app_lang');
      if (saved === 'en' || saved === 'ar') return saved;
    }
    return 'ar';
  }
}
