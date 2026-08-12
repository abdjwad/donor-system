import { Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-refresh-button',
  standalone: true,
  template: `
    <button type="button" class="refresh-btn" (click)="refresh()" [title]="isRtl() ? 'تحديث الصفحة' : 'Refresh page'">
      <span class="material-icons refresh-btn__icon">refresh</span>
      <span class="refresh-btn__text">{{ isRtl() ? 'تحديث' : 'Refresh' }}</span>
    </button>
  `,
  styles: [`
    .refresh-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer; font-family: inherit;
      font-size: 0.875rem; font-weight: 600; color: inherit; opacity: 0.85;
      padding: 6px 4px; border-radius: 8px; transition: opacity 0.15s ease, transform 0.4s ease;
    }
    .refresh-btn:hover { opacity: 1; text-decoration: underline; }
    .refresh-btn:hover .refresh-btn__icon { transform: rotate(90deg); }
    .refresh-btn__icon { font-size: 1.125rem; display: inline-block; transition: transform 0.4s ease; }
  `],
})
export class RefreshButtonComponent {
  private readonly langService = inject(LanguageService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  refresh(): void {
    window.location.reload();
  }
}
