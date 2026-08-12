import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, DisbursementPlan } from '../../../../core/services/admin-api.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';
import { FundingCompletedContractor, FundingCompletedProject, ProjectMilestoneRef, ProjectsStatistics } from '../../../../core/models/repair-project.model';

// كل دفعة (Tranche) مربوطة بمرحلة تهيئة حقيقية بالمشروع — الاسم يجي من اسم
// المرحلة (للعرض فقط، مش قابل للتعديل)، الأدمن بس بيحدّد النسبة %
interface TrancheDraft { milestoneId: number; label: string; percentage: number }

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
  readonly awaitingContractorProjects = signal<FundingCompletedProject[]>([]);
  readonly executionStats = signal<ProjectsStatistics>({ total: 0 });
  readonly selectedContractor = signal<FundingCompletedContractor | null>(null);

  createForm = {
    project_id: null as number | null,
    contractor_name: '',
    contractor_company: '',
    contractor_iban: '',
    tranches: [] as TrancheDraft[],
  };

  get totalPct(): number { return this.createForm.tranches.reduce((s, t) => s + +t.percentage, 0); }

  // المشروع المختار عنده مقاول وتمويل كامل بس بدون ولا مرحلة تهيئة — ما فيه
  // إمكانية إنشاء خطة صرف قبل ما تُضاف مراحل التنفيذ من صفحة "تهيئة المشروع"
  get selectedProjectHasNoMilestones(): boolean {
    return !!this.createForm.project_id && this.createForm.tranches.length === 0;
  }

  // بتوزّع 100% بالتساوي على عدد مراحل التهيئة (الباقي مضاف لآخر دفعة)، والأدمن
  // بعدين حر يعدّل كل نسبة يدوياً بالفورم
  private buildTranchesFromMilestones(milestones: ProjectMilestoneRef[]): TrancheDraft[] {
    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    const n = sorted.length;
    if (n === 0) return [];
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    return sorted.map((m, i) => ({
      milestoneId: m.id,
      label: m.name,
      percentage: base + (i === n - 1 ? remainder : 0),
    }));
  }

  ngOnInit(): void {
    this.load();
    this.repairProjectsApi.getInProgressProjects().subscribe({ next: r => this.executionStats.set(r.statistics) });
    this.repairProjectsApi.getFundingCompletedProjects().subscribe({ next: r => this.projects.set(r.projects) });
    this.repairProjectsApi.getProjectsAwaitingContractorAssignment().subscribe({ next: r => this.awaitingContractorProjects.set(r.projects) });
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
    // عدد الدفعات وأسماؤها تلقائياً من مراحل تهيئة هالمشروع — مش من إدخال حر
    this.createForm.tranches = project ? this.buildTranchesFromMilestones(project.milestones) : [];
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
    this.createForm.tranches = [];
  }

  get canSubmit(): boolean {
    return !!this.createForm.project_id
      && this.createForm.tranches.length > 0
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
      percentages:         this.createForm.tranches.map(t => +t.percentage),
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
