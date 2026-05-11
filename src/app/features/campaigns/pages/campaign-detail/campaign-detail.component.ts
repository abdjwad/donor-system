import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { Campaign } from '../../../../core/models/project.model';
import { MOCK_CAMPAIGNS, MOCK_PROJECTS } from '../../../home/data/mock-data';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { CountdownTimerComponent } from '../../components/countdown-timer/countdown-timer.component';
import { ProjectCardComponent } from '../../../projects/components/project-card/project-card.component';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule,
            NavbarComponent, SiteFooterComponent, CountdownTimerComponent, ProjectCardComponent],
  templateUrl: './campaign-detail.component.html',
  styleUrl: './campaign-detail.component.scss',
})
export class CampaignDetailComponent implements OnInit {
  @Input() id = '';

  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  campaign = signal<Campaign | null>(null);
  readonly relatedProjects = MOCK_PROJECTS.slice(0, 3);

  readonly GALLERY = [
    'https://images.unsplash.com/photo-1593113630400-ea4288922559?w=800&q=80',
    'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=800&q=80',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
  ];

  ngOnInit(): void {
    const cid = parseInt(this.id, 10);
    this.campaign.set(MOCK_CAMPAIGNS.find((c) => c.id === cid) ?? MOCK_CAMPAIGNS[0]);
  }

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
