import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { MOCK_CAMPAIGNS } from '../../../home/data/mock-data';
import { Campaign } from '../../../../core/models/project.model';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { CountdownTimerComponent } from '../../components/countdown-timer/countdown-timer.component';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule,
            NavbarComponent, SiteFooterComponent, CountdownTimerComponent],
  templateUrl: './campaign-list.component.html',
  styleUrl: './campaign-list.component.scss',
})
export class CampaignListComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns: Campaign[] = MOCK_CAMPAIGNS;

  getTitle(c: Campaign): string { return this.isRtl() ? c.titleAr : c.title; }
  getDesc(c: Campaign): string  { return this.isRtl() ? c.descriptionAr : c.description; }

  progressPct(c: Campaign): number {
    return Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100));
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }
}
