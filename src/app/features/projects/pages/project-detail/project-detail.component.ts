import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LanguageService }    from '../../../../core/services/language.service';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';
import { Project }            from '../../../../core/models/project.model';
import { ProjectMilestoneItem } from '../../../../core/models/repair-project.model';
import { NavbarComponent }    from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule, MatIconModule,
            NavbarComponent, SiteFooterComponent, ProjectCardComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  @Input() id = '';

  private readonly langService  = inject(LanguageService);
  private readonly api          = inject(ProjectsApiService);
  private readonly repairApi    = inject(RepairProjectsApiService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  project    = signal<Project | null>(null);
  related    = signal<Project[]>([]);
  activeImage = signal(0);
  loading    = signal(true);
  error      = signal(false);

  roadmap = signal<ProjectMilestoneItem[]>([]);

  ngOnInit(): void {
    const pid = parseInt(this.id, 10);
    if (isNaN(pid)) { this.error.set(true); this.loading.set(false); return; }

    this.api.getProject(pid).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loading.set(false);
        this.api.getProjects({ category: p.category, per_page: 4 }).subscribe(res => {
          this.related.set(res.data.filter(r => r.id !== p.id).slice(0, 3));
        });
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });

    this.repairApi.getProjectProgress(pid).subscribe({
      next: (progress) => this.roadmap.set(progress.roadmap),
      error: () => this.roadmap.set([]),
    });
  }

  get images(): string[] {
    const p = this.project();
    if (!p) return [];
    return p.images.length ? p.images : [p.imageUrl];
  }

  get progressPct(): number {
    const p = this.project();
    if (!p || !p.fundingGoal) return 0;
    return Math.min(100, Math.round((p.amountRaised / p.fundingGoal) * 100));
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }

  setImage(i: number): void { this.activeImage.set(i); }

  getTitle(p: Project): string    { return this.isRtl() ? p.titleAr : p.title; }
  getLocation(p: Project): string { return this.isRtl() ? (p.locationAr ?? p.location) : p.location; }

  // النمط الحالي بالـ template/i18n يستخدم 'ongoing' — الباك اند يرجّع 'in_progress'
  displayStatus(m: ProjectMilestoneItem): 'completed' | 'ongoing' | 'pending' {
    return m.status === 'in_progress' ? 'ongoing' : m.status;
  }

  getMilestoneDate(m: ProjectMilestoneItem): string {
    const date = m.completedAt ?? m.startedAt;
    if (!date) return this.isRtl() ? 'لم تبدأ بعد' : 'Not started yet';
    return new Date(date).toLocaleDateString(this.isRtl() ? 'ar' : 'en', { year: 'numeric', month: 'short' });
  }

  getMilestoneDesc(m: ProjectMilestoneItem): string {
    return m.latestUpdate?.notes ?? '';
  }
}
