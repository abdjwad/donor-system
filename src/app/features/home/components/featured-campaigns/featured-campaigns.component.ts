import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { MOCK_CAMPAIGNS } from '../../data/mock-data';
import { Campaign } from '../../../../core/models/project.model';

@Component({
  selector: 'app-featured-campaigns',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, DecimalPipe],
  templateUrl: './featured-campaigns.component.html',
  styleUrl: './featured-campaigns.component.scss',
})
export class FeaturedCampaignsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns: Campaign[] = MOCK_CAMPAIGNS;

  getTitle(c: Campaign): string {
    return this.isRtl() ? c.titleAr : c.title;
  }

  getDescription(c: Campaign): string {
    return this.isRtl() ? c.descriptionAr : c.description;
  }

  progressPct(c: Campaign): number {
    return Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100));
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }
}
