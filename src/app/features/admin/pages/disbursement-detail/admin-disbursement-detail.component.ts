import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AdminApiService,
  DisbursementPlanDetail,
  DisbursementTranche,
} from '../../../../core/services/admin-api.service';

type FormType = 'report' | 'transfer' | 'reject' | 'ops-reject';

@Component({
  selector: 'app-admin-disbursement-detail',
  standalone: true,
  imports: [FormsModule, MatButtonModule, RouterLink, NgTemplateOutlet],
  templateUrl: './admin-disbursement-detail.component.html',
  styleUrl: './admin-disbursement-detail.component.scss',
})
export class AdminDisbursementDetailComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);
  private readonly authService = inject(AuthService);
  private readonly route       = inject(ActivatedRoute);

  readonly isRtl   = computed(() => this.langService.currentLang() === 'ar');
  readonly plan    = signal<DisbursementPlanDetail | null>(null);

  // فصل المهام (Maker-Checker): منشئ الخطة لا يقدر يراجع/يوافق/ينفذ تحويل لدفعاتها
  readonly isPlanOwner = computed(() => {
    const plan = this.plan();
    const user = this.authService.currentUser();
    return !!plan && !!user && plan.created_by === user.id;
  });

  // الموافقة التنفيذية (ops-approve) مقصورة على مدير العمليات/السوبر أدمن — نفس صلاحية الباك اند
  readonly isOpsReviewer = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'operations_manager' || role === 'super_admin';
  });

  readonly loading = signal(true);
  readonly saving  = signal(false);

  readonly activeForm = signal<{ trancheId: number; type: FormType } | null>(null);

  reportForm   = { title: '', description: '', completion_percentage: 30, report_date: '' };
  transferForm = { transfer_reference: '', transfer_date: '', notes: '' };
  rejectForm   = { rejected_reason: '' };
  opsRejectForm = { rejected_reason: '' };

  private get planId(): number { return +(this.route.snapshot.paramMap.get('id') ?? 0); }

  ngOnInit(): void { this.loadPlan(); }

  loadPlan(): void {
    this.loading.set(true);
    this.adminApi.getDisbursementPlan(this.planId).subscribe({
      next: p  => { this.plan.set(p);  this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(trancheId: number, type: FormType): void {
    const today = new Date().toISOString().split('T')[0];
    this.reportForm    = { title: '', description: '', completion_percentage: 30, report_date: today };
    this.transferForm  = { transfer_reference: '', transfer_date: today, notes: '' };
    this.rejectForm    = { rejected_reason: '' };
    this.opsRejectForm = { rejected_reason: '' };
    this.activeForm.set({ trancheId, type });
  }

  closeForm(): void { this.activeForm.set(null); }

  isFormOpen(trancheId: number, type: FormType): boolean {
    const f = this.activeForm();
    return f?.trancheId === trancheId && f?.type === type;
  }

  submitReport(trancheId: number): void {
    this.saving.set(true);
    this.adminApi.submitProgressReport(trancheId, this.reportForm).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  // الدفعة الأولى فقط — بتنصرف عند توقيع العقد بدون تقرير إنجاز
  activateFirst(trancheId: number): void {
    this.saving.set(true);
    this.adminApi.activateFirstTranche(trancheId).subscribe({
      next: () => { this.saving.set(false); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  opsApprove(trancheId: number): void {
    this.saving.set(true);
    this.adminApi.opsApproveTranche(trancheId).subscribe({
      next: () => { this.saving.set(false); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  submitOpsReject(trancheId: number): void {
    if (!this.opsRejectForm.rejected_reason.trim()) return;
    this.saving.set(true);
    this.adminApi.opsRejectTranche(trancheId, this.opsRejectForm.rejected_reason).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  approveTranche(trancheId: number): void {
    this.saving.set(true);
    this.adminApi.approveTranche(trancheId).subscribe({
      next: () => { this.saving.set(false); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  submitReject(trancheId: number): void {
    if (!this.rejectForm.rejected_reason.trim()) return;
    this.saving.set(true);
    this.adminApi.rejectTranche(trancheId, this.rejectForm.rejected_reason).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  submitTransfer(trancheId: number): void {
    if (!this.transferForm.transfer_reference.trim()) return;
    this.saving.set(true);
    this.adminApi.recordTransfer(trancheId, this.transferForm).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadPlan(); },
      error: () => this.saving.set(false),
    });
  }

  toggleSuspend(): void {
    const plan = this.plan();
    if (!plan) return;
    const obs = plan.status === 'suspended'
      ? this.adminApi.resumePlan(plan.id)
      : this.adminApi.suspendPlan(plan.id);
    obs.subscribe({ next: () => this.loadPlan() });
  }

  disbursedPct(): number {
    const p = this.plan();
    if (!p || !p.total_amount) return 0;
    return Math.round((p.total_disbursed / p.total_amount) * 100);
  }

  projectTitle(): string {
    const p = this.plan();
    if (!p) return '';
    return this.isRtl() ? p.project_title_ar : p.project_title_en;
  }

  trancheLabel(t: DisbursementTranche): string {
    return this.isRtl() ? t.label_ar : t.label_en;
  }

  staIcon(status: string): string {
    const map: Record<string, string> = {
      locked: 'lock', pending_ops_review: 'engineering', pending_review: 'pending_actions',
      approved: 'check_circle', transferred: 'price_check', rejected: 'cancel',
    };
    return map[status] ?? 'help_outline';
  }

  staLabel(status: string): string {
    if (!this.isRtl()) return status === 'pending_ops_review' ? 'pending ops review' : status.replace('_', ' ');
    const map: Record<string, string> = {
      locked: 'مقفلة', pending_ops_review: 'بانتظار موافقة مدير العمليات', pending_review: 'بانتظار المراجعة المالية',
      approved: 'موافق عليها', transferred: 'تم التحويل', rejected: 'مرفوضة',
    };
    return map[status] ?? status;
  }

  fmt(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n;
  }

  planSuspended(): boolean { return this.plan()?.status === 'suspended'; }
}
