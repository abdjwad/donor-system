import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss',
})
export class UnauthorizedComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
}
