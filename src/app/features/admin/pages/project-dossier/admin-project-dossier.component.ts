import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, AdminDonation, DisbursementPlanDetail } from '../../../../core/services/admin-api.service';
import { AdminApprovedProjectsApiService } from '../../../../core/services/admin-approved-projects-api.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';
import { ProjectDetailOverview } from '../../../../core/models/approved-project.model';
import { ProjectProgress } from '../../../../core/models/repair-project.model';

type DossierTab = 'overview' | 'funding' | 'execution' | 'disbursement';

@Component({
  selector: 'app-admin-project-dossier',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './admin-project-dossier.component.html',
  styleUrl: './admin-project-dossier.component.scss',
})
export class AdminProjectDossierComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi = inject(AdminApiService);
  private readonly approvedProjectsApi = inject(AdminApprovedProjectsApiService);
  private readonly repairProjectsApi = inject(RepairProjectsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeTab = signal<DossierTab>('overview');

  readonly overview = signal<ProjectDetailOverview | null>(null);
  readonly donations = signal<AdminDonation[]>([]);
  readonly progress = signal<ProjectProgress | null>(null);
  readonly plan = signal<DisbursementPlanDetail | null>(null);

  readonly totalCollected = computed(() =>
    this.donations()
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0)
  );

  private get projectId(): number {
    return +(this.route.snapshot.paramMap.get('id') ?? 0);
  }

  ngOnInit(): void {
    const id = this.projectId;
    if (!id) { this.error.set(true); this.loading.set(false); return; }

    forkJoin({
      overview: this.approvedProjectsApi.getProjectDetails(id).pipe(catchError(() => of(null))),
      donations: this.adminApi.getDonations({ project_id: id }).pipe(catchError(() => of({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } }))),
      progress: this.repairProjectsApi.getProjectProgress(id).pipe(catchError(() => of(null))),
      plans: this.adminApi.getDisbursementPlans().pipe(catchError(() => of({ data: [], summary: { total_plans: 0, total_disbursed: 0, pending_tranches: 0 } }))),
    }).subscribe(({ overview, donations, progress, plans }) => {
      if (!overview) { this.error.set(true); this.loading.set(false); return; }

      this.overview.set(overview);
      this.donations.set(donations.data);
      this.progress.set(progress);

      const matchingPlan = plans.data.find((p) => p.project_id === id);
      if (matchingPlan) {
        this.adminApi.getDisbursementPlan(matchingPlan.id).subscribe({
          next: (detail) => this.plan.set(detail),
        });
      }

      this.loading.set(false);
    });
  }

  setTab(tab: DossierTab): void { this.activeTab.set(tab); }

  get title(): string {
    const o = this.overview();
    if (!o) return '';
    return this.isRtl()
      ? `مشروع ترميم - ${o.project.location}`
      : `Restoration Project - ${o.project.location}`;
  }

  fmt(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n;
  }

  donationTypeLabel(d: AdminDonation): string {
    return d.donation_type === 'monthly'
      ? (this.isRtl() ? 'شهري' : 'Monthly')
      : (this.isRtl() ? 'لمرة واحدة' : 'One-time');
  }

  milestoneStatus(status: string): 'completed' | 'ongoing' | 'pending' {
    return status === 'in_progress' ? 'ongoing' : (status as 'completed' | 'pending');
  }

  trancheLabel(t: { label_ar: string; label_en: string }): string {
    return this.isRtl() ? t.label_ar : t.label_en;
  }

  staLabel(status: string): string {
    const map: Record<string, string> = {
      locked: 'مقفلة', pending_ops_review: 'بانتظار موافقة مدير العمليات', pending_review: 'بانتظار المراجعة المالية',
      approved: 'موافق عليها', transferred: 'تم التحويل', rejected: 'مرفوضة',
    };
    return this.isRtl() ? (map[status] ?? status) : status.replace('_', ' ');
  }
}
