import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService }    from '../../../../core/services/language.service';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { Campaign }           from '../../../../core/models/project.model';

@Component({
  selector: 'app-featured-campaigns',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, DecimalPipe],
  templateUrl: './featured-campaigns.component.html',
  styleUrl: './featured-campaigns.component.scss',
})
export class FeaturedCampaignsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly api         = inject(ProjectsApiService);

  readonly isRtl    = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns = signal<Campaign[]>([]);

  ngOnInit(): void {
    this.api.getCampaigns().subscribe({ next: (c) => this.campaigns.set(c.slice(0, 3)) });
  }

  getTitle(c: Campaign): string       { return this.isRtl() ? c.titleAr : c.title; }
  getDescription(c: Campaign): string { return this.isRtl() ? c.descriptionAr : c.description; }

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
