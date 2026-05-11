import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  private readonly langService = inject(LanguageService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly currentLang = this.langService.currentLang;

  toggleLanguage(): void {
    this.langService.toggle();
  }
}
