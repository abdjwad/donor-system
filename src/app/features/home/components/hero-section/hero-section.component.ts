import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { PLATFORM_STATS } from '../../data/mock-data';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, DecimalPipe],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly stats = PLATFORM_STATS;
}
