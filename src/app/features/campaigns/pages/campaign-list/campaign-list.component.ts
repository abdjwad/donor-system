import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

import { LanguageService }    from '../../../../core/services/language.service';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { Campaign }           from '../../../../core/models/project.model';
import { NavbarComponent }    from '../../../../shared/components/navbar/navbar.component';
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
export class CampaignListComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly api         = inject(ProjectsApiService);

  readonly isRtl     = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns = signal<Campaign[]>([]);
  readonly loading   = signal(true);
  readonly error     = signal(false);

  ngOnInit(): void {
    this.api.getCampaigns().subscribe({
      next:  (data) => { this.campaigns.set(data); this.loading.set(false); },
      error: ()     => { this.error.set(true);     this.loading.set(false); },
    });
  }

  getTitle(c: Campaign): string { return this.isRtl() ? c.titleAr : c.title; }
  getDesc(c: Campaign): string  { return this.isRtl() ? c.descriptionAr : c.description; }

  progressPct(c: Campaign): number {
    if (!c.targetAmount) return 0;
    return Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100));
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }
}
