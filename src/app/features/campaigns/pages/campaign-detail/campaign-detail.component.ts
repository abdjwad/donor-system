import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

import { LanguageService }    from '../../../../core/services/language.service';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { Campaign, Project }  from '../../../../core/models/project.model';
import { NavbarComponent }    from '../../../../shared/components/navbar/navbar.component';
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
  private readonly api         = inject(ProjectsApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  campaign        = signal<Campaign | null>(null);
  relatedProjects = signal<Project[]>([]);
  loading         = signal(true);
  error           = signal(false);

  get gallery(): string[] {
    const c = this.campaign();
    if (!c) return [];
    const projectImages = (c.projects ?? []).flatMap(p => p.images.length ? p.images : [p.imageUrl]);
    const all = [c.imageUrl, ...projectImages].filter(Boolean);
    return Array.from(new Set(all));
  }

  ngOnInit(): void {
    const cid = parseInt(this.id, 10);
    if (isNaN(cid)) { this.error.set(true); this.loading.set(false); return; }

    this.api.getCampaign(cid).subscribe({
      next: (c) => {
        this.campaign.set(c);
        this.relatedProjects.set(c.projects?.slice(0, 3) ?? []);
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
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
