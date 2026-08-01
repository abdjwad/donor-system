import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, DisbursementPlan } from '../../../../core/services/admin-api.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';
import { FundingCompletedContractor, FundingCompletedProject, ProjectsStatistics } from '../../../../core/models/repair-project.model';

interface TrancheDraft { label_ar: string; label_en: string; percentage: number }

@Component({
  selector: 'app-admin-disbursements',
  standalone: true,
  imports: [FormsModule, MatButtonModule, DecimalPipe, RouterLink],
  templateUrl: './admin-disbursements.component.html',
  styleUrl: './admin-disbursements.component.scss',
})
export class AdminDisbursementsComponent implements OnInit {
  private readonly langService     = inject(LanguageService);
  private readonly adminApi        = inject(AdminApiService);
  private readonly repairProjectsApi = inject(RepairProjectsApiService);
  private readonly router          = inject(Router);
readonly isRtl   = computed(() => this.langService.currentLang() === 'ar');
  readonly plans   = signal<DisbursementPlan[]>([]);
  readonly loading = signal(true);
  readonly summary = signal({ total_plans: 0, total_disbursed: 0, pending_tranches: 0 });
  readonly showCreate = signal(false);
  readonly creating   = signal(false);
  readonly projects   = signal<FundingCompletedProject[]>([]);
  readonly executionStats = signal<ProjectsStatistics>({ total: 0 });
  readonly selectedContractor = signal<FundingCompletedContractor | null>(null);

  createForm = {
    project_id: null as number | null,
    contractor_name: '',
    contractor_company: '',
    contractor_iban: '',
    tranches: [
      { label_ar: 'دفعة أولى — بداية التنفيذ',    label_en: 'First Tranche — Foundation',     percentage: 30 },
      { label_ar: 'دفعة ثانية — منتصف التنفيذ',   label_en: 'Second Tranche — Midpoint',      percentage: 40 },
      { label_ar: 'دفعة ثالثة — التسليم النهائي', label_en: 'Third Tranche — Final Delivery', percentage: 30 },
    ] as TrancheDraft[],
  };

  get totalPct(): number { return this.createForm.tranches.reduce((s, t) => s + +t.percentage, 0); }

  ngOnInit(): void {
    this.load();
    this.repairProjectsApi.getInProgressProjects().subscribe({ next: r => this.executionStats.set(r.statistics) });
    this.repairProjectsApi.getFundingCompletedProjects().subscribe({ next: r => this.projects.set(r.projects) });

  }

  load(): void {
    this.loading.set(true);
    this.adminApi.getDisbursementPlans().subscribe({
      next: res => { this.plans.set(res.data); this.summary.set(res.summary); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  onProjectSelect(projectId: number | null): void {
    const project = this.projects().find(p => p.id === projectId);
    this.selectedContractor.set(project?.contractor ?? null);
    if (project?.contractor) {
      this.createForm.contractor_name = project.contractor.name;
      this.createForm.contractor_company = project.contractor.companyName ?? '';
      this.createForm.contractor_iban = project.contractor.bankInfo?.iban ?? '';
    }
  }

  toggleCreate(): void {
    this.showCreate.update(v => !v);
    if (!this.showCreate()) this.resetForm();
  }

  resetForm(): void {
    this.createForm.project_id       = null;
    this.createForm.contractor_name  = '';
    this.createForm.contractor_company = '';
    this.createForm.contractor_iban  = '';
    this.selectedContractor.set(null);
    this.createForm.tranches = [
      { label_ar: 'دفعة أولى — بداية التنفيذ',    label_en: 'First Tranche — Foundation',     percentage: 30 },
      { label_ar: 'دفعة ثانية — منتصف التنفيذ',   label_en: 'Second Tranche — Midpoint',      percentage: 40 },
      { label_ar: 'دفعة ثالثة — التسليم النهائي', label_en: 'Third Tranche — Final Delivery', percentage: 30 },
    ];
  }

  addTranche(): void {
    this.createForm.tranches.push({ label_ar: '', label_en: '', percentage: 0 });
  }

  removeTranche(index: number): void {
    this.createForm.tranches.splice(index, 1);
  }

  get canSubmit(): boolean {
    return !!this.createForm.project_id
      && this.totalPct === 100
      && !!this.selectedContractor()?.hasBankInfo;
  }

  submitCreate(): void {
    if (!this.canSubmit || !this.createForm.project_id) return;
    this.creating.set(true);
    this.adminApi.createDisbursementPlan({
      project_id:          this.createForm.project_id,
      contractor_name:     this.createForm.contractor_name,
      contractor_company:  this.createForm.contractor_company,
      contractor_iban:     this.createForm.contractor_iban,
      tranches:            this.createForm.tranches.map(t => ({ ...t, percentage: +t.percentage })),
    }).subscribe({
      next: plan => { this.creating.set(false); this.router.navigate(['/admin/disbursements', plan.id]); },
      error: ()  => this.creating.set(false),
    });
  }

  viewPlan(id: number): void { this.router.navigate(['/admin/disbursements', id]); }

projectTitle(p: FundingCompletedProject): string { return `#${p.requestNumber} — ${p.location}`; }
  planTitle(plan: DisbursementPlan): string { return this.isRtl() ? plan.project_title_ar : plan.project_title_en; }

  fmt(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n;
  }

  staLabel(s: string): string {
    if (!this.isRtl()) return s.charAt(0).toUpperCase() + s.slice(1);
    const map: Record<string, string> = { active: 'نشطة', suspended: 'موقوفة', completed: 'مكتملة' };
    return map[s] ?? s;
  }
}
