import { Component, computed, inject, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button type="button" class="back-btn" (click)="goBack()" [title]="isRtl() ? 'رجوع' : 'Back'">
      <span class="material-icons back-btn__icon">{{ isRtl() ? 'arrow_forward' : 'arrow_back' }}</span>
      <span class="back-btn__text">{{ isRtl() ? 'رجوع' : 'Back' }}</span>
    </button>
  `,
  styles: [`
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer; font-family: inherit;
      font-size: 0.875rem; font-weight: 600; color: inherit; opacity: 0.85;
      padding: 6px 4px; border-radius: 8px; transition: opacity 0.15s ease;
    }
    .back-btn:hover { opacity: 1; text-decoration: underline; }
    .back-btn__icon { font-size: 1.125rem; }
  `],
})
export class BackButtonComponent {
  private readonly location    = inject(Location);
  private readonly router      = inject(Router);
  private readonly langService = inject(LanguageService);

  // مسار احتياطي إذا ما في history سابق بنفس التبويب (فتح مباشر/رابط خارجي)
  @Input() fallback = '/home';

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this.fallback);
    }
  }
}
