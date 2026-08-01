import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';
import { DonationService } from '../../../donate/services/donation.service';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';

interface BeforeAfterItem {
  beforeUrl: string;
  afterUrl: string;
  titleAr: string;
  titleEn: string;
}

@Component({
  selector: 'app-donation-impact',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, NavbarComponent, SiteFooterComponent, DashSidebarComponent],
  templateUrl: './donation-impact.component.html',
  styleUrl: './donation-impact.component.scss',
})
export class DonationImpactComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly donationApi = inject(DonationService);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly repairApi   = inject(RepairProjectsApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly myStats = signal({ families: 0, projects: 0, amount: 0 });
  readonly beforeAfterItems = signal<BeforeAfterItem[]>([]);
  readonly loadingImpact = signal(true);

  ngOnInit(): void {
    this.donationApi.getDashboardStats().subscribe({
      next: (s) => this.myStats.set({
        families: s.families_helped ?? 0,
        projects: s.projects_supported ?? 0,
        amount: s.total_donated ?? 0,
      }),
      error: () => {},
    });

    this.donationApi.getHistory(1).subscribe({
      next: (res) => this.loadCompletedProjectImages(res.data ?? []),
      error: () => this.loadingImpact.set(false),
    });
  }

  private loadCompletedProjectImages(donations: any[]): void {
    const projectIds = Array.from(new Set(
      donations.map(d => d.project?.id).filter((id): id is number => !!id)
    ));

    if (!projectIds.length) { this.loadingImpact.set(false); return; }

    const requests = projectIds.map(id =>
      this.projectsApi.getProject(id).pipe(
        switchMap(project => {
          if (project.status !== 'completed') return of(null);
          return this.repairApi.getProjectProgress(id).pipe(
            switchMap(progress => {
              const lastWithImage = [...progress.roadmap].reverse().find(m => m.latestUpdate?.images?.length);
              const afterUrl = lastWithImage?.latestUpdate?.images[0];
              if (!afterUrl) return of(null);
              return of({
                beforeUrl: project.images[0] ?? project.imageUrl,
                afterUrl,
                titleAr: project.titleAr,
                titleEn: project.title,
              } as BeforeAfterItem);
            }),
            catchError(() => of(null)),
          );
        }),
        catchError(() => of(null)),
      )
    );

    forkJoin(requests).subscribe({
      next: (items) => {
        this.beforeAfterItems.set(items.filter((i): i is BeforeAfterItem => !!i));
        this.loadingImpact.set(false);
      },
      error: () => this.loadingImpact.set(false),
    });
  }

  getTitle(t: { titleAr: string; titleEn: string }): string { return this.isRtl() ? t.titleAr : t.titleEn; }
}
