import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { ApiResponse } from '../models/auth-response.models';
import { environment } from '../../../environments/environment';

// ── Interfaces ──────────────────────────────────────────────────
export interface AdminOverview {
  stats: { total_donations: number; total_donors: number; active_projects: number; pending_refunds: number; families_helped: number };
  recent_donations: AdminRecentDonation[];
  by_category: AdminCategory[];
}
export interface AdminRecentDonation {
  id: number; reference: string; name: string;
  amount: number; payment_method: string; status: string;
  project_ar: string; project_en: string; created_at: string;
}
export interface AdminCategory { category: string; total: number; count: number; }

export interface AdminDonation {
  id: number; reference: string; name: string; email: string;
  amount: number; currency: string; payment_method: string; status: string;
  donation_type: string; is_anonymous: boolean; dedication_message: string | null;
  is_split_overflow: boolean;
  redirected_from_project_id: number | null;
  redirected_from_project_ar: string | null;
  redirected_from_project_en: string | null;
  bank_transfer_reference: string | null; wallet_id: number | null; bank_account_name: string | null; receipt_url: string | null;
  receipt_submitted_at: string | null;
  project_ar: string; project_en: string; created_at: string;
}

export interface Wallet {
  id: number;
  name: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban: string;
  currency: string;
  is_active: boolean;
  notes: string | null;
}
export interface WalletBreakdownProject {
  id: number;
  title: string;
  amount: number;
}
export interface WalletBreakdown {
  projects: WalletBreakdownProject[];
  general_fund: number;
  total: number;
}
export interface AdminRefund {
  id: number; amount: number; reason: string; status: string;
  reference: string; donor_name: string; donor_email: string;
  requested_by: string; requested_at: string;
}
export interface AdminCampaign {
  id: number; title_ar: string; title_en: string;
  category: string; status: string;
  funding_goal: number; amount_raised: number;
  donors_count: number; days_left: number; progress_pct: number;
  is_urgent: boolean; ends_at: string | null;
}
export interface PageMeta { total: number; current_page: number; last_page: number; }

export interface AdminWalletTopup {
  id: number; reference: string; user_name: string | null; user_email: string | null;
  amount: number; currency: string; payment_method: string; status: string;
  bank_transfer_reference: string | null; wallet_id: number | null; bank_account_name: string | null; receipt_url: string | null;
  receipt_submitted_at: string | null; created_at: string;
}

// ── Disbursements ────────────────────────────────────────────────
export interface DisbursementPlan {
  id: number;
  project_id: number;
  project_title_ar: string;
  project_title_en: string;
  project_location: string;
  total_amount: number;
  total_disbursed: number;
  contractor_name: string;
  contractor_company: string;
  contractor_iban: string;
  created_by: number;
  created_by_name: string;
  status: 'active' | 'suspended' | 'completed';
  tranches_count: number;
  tranches_pending: number;
  created_at: string;
}

export interface DisbursementPlanDetail extends DisbursementPlan {
  tranches: DisbursementTranche[];
}

export interface DisbursementTranche {
  id: number;
  plan_id: number;
  milestone_id: number | null;
  tranche_number: number;
  label_ar: string;
  label_en: string;
  amount: number;
  percentage: number;
  status: 'locked' | 'pending_ops_review' | 'pending_review' | 'approved' | 'transferred' | 'rejected';
  /** false فقط للدفعة الأولى — بتتفعّل مباشرة بدون تقرير إنجاز (انظر activateFirstTranche) */
  requires_report?: boolean;
  progress_report?: ProgressReport;
  transfer_reference?: string;
  transfer_date?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  ops_approved_by?: string;
  ops_approved_at?: string;
  ops_rejected_reason?: string;
  is_final_tranche?: boolean;
  notes?: string;
}

export interface ProgressReport {
  id: number;
  title: string;
  description: string;
  completion_percentage: number;
  report_date: string;
  submitted_at: string;
  submitted_by?: string;
  images: string[];
}

export interface AdminReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  title_ar: string;
  title_en: string;
  count: number;
  total: number;
  date: string;
}

export interface ReportSummary {
  total_count: number;
  total_amount: number;
  total_donors: number;
}

// ── Financial Ledger (السجل المالي الشامل) ─────────────────────────
export type LedgerType = 'all' | 'donation' | 'wallet_topup' | 'refund' | 'disbursement' | 'obstacle_funding';

export interface LedgerRow {
  type: 'donation' | 'wallet_topup' | 'refund' | 'disbursement' | 'obstacle_funding';
  direction: 'in' | 'out';
  reference: string;
  date: string;
  party_name: string;
  party_email: string;
  amount: number;
  currency: string;
  method: string;
  bank_account: string;
  context: string;
  status: string;
  approved_by: string;
  notes: string;
}

export interface LedgerSummary {
  count: number;
  total_in: number;
  total_out: number;
  net: number;
  by_type: Record<string, { count: number; amount: number }>;
}

export interface LedgerResponse {
  data: LedgerRow[];
  meta: { total: number; page: number; per_page: number };
  summary: LedgerSummary;
  range: { from: string; to: string };
}

export interface LedgerFilters {
  date_from?: string;
  date_to?: string;
  type?: LedgerType;
  search?: string;
  page?: number;
  per_page?: number;
}

// ── Financial Obstacles (العوائق المالية) ──────────────────────────
// 'open' = لسا ما تحسم فيها (pending+in_progress سوا، الافتراضي بالباك اند بدون
// إرسال status إطلاقاً) — مختلف عن 'pending' الحرفية يلي بتفلتر pending بس
export type FinancialObstacleStatus = 'open' | 'pending' | 'in_progress' | 'funded' | 'rejected' | 'all';

export interface FinancialObstacle {
  id: number;
  title: string;
  description: string;
  type: string;
  type_label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_label: string;
  status: string;
  status_label: string;
  delay_days: number;
  additional_cost: number;
  attachments: string[];
  created_at: string;
  project: {
    id: number;
    request_number: string;
    location: string;
    total_estimated_cost: number;
    collected_amount: number;
    funding_progress: number;
  };
  beneficiary: { id: number | null; name: string | null; phone: string | null };
  contractor: { id: number; name: string; company_name: string | null } | null;
  amount_required: number;
  reported_by: { id: number; name: string };
  funded_amount: number | null;
  funded_at: string | null;
  funded_by: string | null;
  rejection_reason: string | null;
}

export interface FinancialObstaclesResult {
  statistics: {
    total_financial_obstacles: number;
    total_amount_needed: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
  };
  obstacles: FinancialObstacle[];
}

// ── Service ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly API  = `${environment.apiUrl}/v1/admin`;
  // العوائق (المالية وغيرها) على مسار legacy بدون /v1/admin — راجع routes/api.php
  private readonly BASE = environment.apiUrl;

  // Overview
  getOverview(): Observable<AdminOverview> {
    return this.http.get<ApiResponse<AdminOverview>>(`${this.API}/overview`)
      .pipe(map(r => r.data));
  }

  // Donations
  getDonations(params: { status?: string; search?: string; page?: number; project_id?: number } = {}): Observable<{ data: AdminDonation[]; meta: PageMeta }> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    if (params.page)   p = p.set('page',   String(params.page));
    if (params.project_id) p = p.set('project_id', String(params.project_id));
    return this.http.get<ApiResponse<any>>(`${this.API}/donations`, { params: p })
      .pipe(map(r => r.data));
  }

  refundDonation(id: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/donations/${id}/refund`, { reason })
      .pipe(map(() => void 0));
  }

  confirmDonation(id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/donations/${id}/confirm`, {})
      .pipe(map(() => void 0));
  }

  rejectDonation(id: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/donations/${id}/reject`, { reason })
      .pipe(map(() => void 0));
  }

  reassignDonationWallet(id: number, wallet_id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/donations/${id}/wallet`, { wallet_id })
      .pipe(map(() => void 0));
  }

  // ── Donor wallet top-ups (شحن محفظة المتبرعين) ────────────────
  getWalletTopups(params: { status?: string; page?: number } = {}): Observable<{ data: AdminWalletTopup[]; meta: PageMeta }> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.page) p = p.set('page', String(params.page));
    return this.http.get<ApiResponse<any>>(`${this.API}/wallet-topups`, { params: p })
      .pipe(map(r => r.data));
  }

  confirmWalletTopup(id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/wallet-topups/${id}/confirm`, {})
      .pipe(map(() => void 0));
  }

  rejectWalletTopup(id: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/wallet-topups/${id}/reject`, { reason })
      .pipe(map(() => void 0));
  }

  reassignWalletTopupWallet(id: number, wallet_id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/wallet-topups/${id}/wallet`, { wallet_id })
      .pipe(map(() => void 0));
  }

  // Wallets
  getWallets(): Observable<Wallet[]> {
    return this.http.get<ApiResponse<Wallet[]>>(`${this.API}/wallets`)
      .pipe(map(r => r.data));
  }

  createWallet(data: Partial<Wallet>): Observable<Wallet> {
    return this.http.post<ApiResponse<Wallet>>(`${this.API}/wallets`, data)
      .pipe(map(r => r.data));
  }

  updateWallet(id: number, data: Partial<Wallet>): Observable<Wallet> {
    return this.http.put<ApiResponse<Wallet>>(`${this.API}/wallets/${id}`, data)
      .pipe(map(r => r.data));
  }

  getWalletBreakdown(): Observable<WalletBreakdown> {
    return this.http.get<ApiResponse<WalletBreakdown>>(`${this.API}/wallets/breakdown`)
      .pipe(map(r => r.data));
  }

  // Refunds
  getRefunds(status?: string): Observable<{ data: AdminRefund[]; meta: PageMeta }> {
    let p = new HttpParams();
    if (status && status !== 'all') p = p.set('status', status);
    return this.http.get<ApiResponse<any>>(`${this.API}/refunds`, { params: p })
      .pipe(map(r => r.data));
  }

  approveRefund(id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/refunds/${id}/approve`, {})
      .pipe(map(() => void 0));
  }

  rejectRefund(id: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/refunds/${id}/reject`, { reason })
      .pipe(map(() => void 0));
  }

  // Campaigns (admin)
  getCampaigns(status?: string): Observable<{ data: AdminCampaign[]; meta: PageMeta }> {
    let p = new HttpParams();
    if (status && status !== 'all') p = p.set('status', status);
    return this.http.get<ApiResponse<any>>(`${this.API}/campaigns`, { params: p })
      .pipe(map(r => r.data));
  }

  createCampaign(data: Record<string, any>): Observable<AdminCampaign> {
    return this.http.post<ApiResponse<AdminCampaign>>(`${this.API}/campaigns`, data)
      .pipe(map(r => r.data));
  }

  updateCampaign(id: number, data: Record<string, any>): Observable<AdminCampaign> {
    return this.http.put<ApiResponse<AdminCampaign>>(`${this.API}/campaigns/${id}`, data)
      .pipe(map(r => r.data));
  }

  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.API}/campaigns/${id}`)
      .pipe(map(() => void 0));
  }

  // Reports
  getReports(filters: { dateFrom?: string; dateTo?: string; type?: string } = {}):
      Observable<{ reports: AdminReport[]; summary: ReportSummary }> {
    let p = new HttpParams();
    if (filters.dateFrom) p = p.set('date_from', filters.dateFrom);
    if (filters.dateTo)   p = p.set('date_to',   filters.dateTo);
    if (filters.type && filters.type !== 'all') p = p.set('type', filters.type);
    const empty = { total_count: 0, total_amount: 0, total_donors: 0 };
    return this.http.get<ApiResponse<any>>(`${this.API}/reports`, { params: p })
      .pipe(map(r => ({
        reports: r.data?.reports ?? [],
        summary: r.data?.summary ?? empty,
      })));
  }

  // Disbursements
  getDisbursementPlans(status?: string): Observable<{ data: DisbursementPlan[]; summary: { total_plans: number; total_disbursed: number; pending_tranches: number } }> {
    let p = new HttpParams();
    if (status && status !== 'all') p = p.set('status', status);
    const empty = { data: [] as DisbursementPlan[], summary: { total_plans: 0, total_disbursed: 0, pending_tranches: 0 } };
    return this.http.get<ApiResponse<any>>(`${this.API}/disbursements`, { params: p })
      .pipe(map(r => r.data ?? empty));
  }

  getDisbursementPlan(id: number): Observable<DisbursementPlanDetail> {
    return this.http.get<ApiResponse<DisbursementPlanDetail>>(`${this.API}/disbursements/${id}`)
      .pipe(map(r => r.data));
  }

  createDisbursementPlan(data: {
    project_id: number;
    contractor_name: string;
    contractor_company: string;
    contractor_iban: string;
    // عدد النسب لازم يساوي بالضبط عدد مراحل تهيئة المشروع — الباك اند بيربط كل
    // نسبة بمرحلة حسب ترتيبها تلقائياً (label/tranche_number مش مُدخَلين يدوياً)
    percentages: number[];
  }): Observable<DisbursementPlan> {
    return this.http.post<ApiResponse<DisbursementPlan>>(`${this.API}/disbursements`, data)
      .pipe(map(r => r.data));
  }

  suspendPlan(id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/${id}/suspend`, {})
      .pipe(map(() => void 0));
  }

  resumePlan(id: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/${id}/resume`, {})
      .pipe(map(() => void 0));
  }

  submitProgressReport(trancheId: number, data: { title: string; description: string; completion_percentage: number; report_date: string }): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/report`, data)
      .pipe(map(() => void 0));
  }

  // الدفعة الأولى فقط — تفعيل مباشر لإرسالها لمراجعة مدير العمليات بدون تقرير إنجاز
  activateFirstTranche(trancheId: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/activate-first`, {})
      .pipe(map(() => void 0));
  }

  opsApproveTranche(trancheId: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/ops-approve`, {})
      .pipe(map(() => void 0));
  }

  opsRejectTranche(trancheId: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/ops-reject`, { reason })
      .pipe(map(() => void 0));
  }

  approveTranche(trancheId: number): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/approve`, {})
      .pipe(map(() => void 0));
  }

  rejectTranche(trancheId: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/reject`, { reason })
      .pipe(map(() => void 0));
  }

  recordTransfer(trancheId: number, data: { transfer_reference: string; transfer_date: string; notes?: string }): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/disbursements/tranches/${trancheId}/transfer`, data)
      .pipe(map(() => void 0));
  }

  // يرجّع Observable<void> بدل ما يشتغل بصمت — أي خطأ (حتى لو جسمه Blob بما إنه responseType=blob)
  // بينحلّ لرسالة نصية حقيقية بدل ما يضيع بداخل Blob غير مقروء بالـ console
  exportReport(type: string, period: string, format: 'pdf' | 'excel' | 'csv' = 'csv'): Observable<void> {
    const url = `${this.API}/reports/export?type=${type}&period=${encodeURIComponent(period)}&format=${format}`;
    const ext = format === 'excel' ? 'xlsx' : format;

    return this.http.get(url, { responseType: 'blob' }).pipe(
      map((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a         = document.createElement('a');
        a.href          = objectUrl;
        a.download      = `bunian_report_${type}_${period}.${ext}`;
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.error instanceof Blob) {
          return from(err.error.text()).pipe(
            switchMap((text) => {
              let message = 'تعذّر تصدير التقرير';
              try { message = JSON.parse(text)?.message ?? message; } catch { /* ignore parse errors */ }
              return throwError(() => new Error(message));
            }),
          );
        }
        return throwError(() => new Error(err.error?.message ?? 'تعذّر تصدير التقرير'));
      }),
    );
  }

  // ── Financial Ledger (السجل المالي الشامل) ────────────────────
  private ledgerParams(filters: LedgerFilters): HttpParams {
    let p = new HttpParams();
    if (filters.date_from) p = p.set('date_from', filters.date_from);
    if (filters.date_to)   p = p.set('date_to',   filters.date_to);
    if (filters.type && filters.type !== 'all') p = p.set('type', filters.type);
    if (filters.search)    p = p.set('search',   filters.search);
    if (filters.page)      p = p.set('page',     String(filters.page));
    if (filters.per_page)  p = p.set('per_page', String(filters.per_page));
    return p;
  }

  getFinancialLedger(filters: LedgerFilters = {}): Observable<LedgerResponse> {
    return this.http.get<ApiResponse<LedgerResponse>>(`${this.API}/financial-ledger`, { params: this.ledgerParams(filters) })
      .pipe(map(r => r.data));
  }

  exportFinancialLedger(filters: LedgerFilters, format: 'pdf' | 'excel' | 'csv' = 'csv'): Observable<void> {
    const params = this.ledgerParams(filters).set('format', format);
    const url = `${this.API}/financial-ledger/export`;
    const ext = format === 'excel' ? 'xlsx' : format;

    return this.http.get(url, { params, responseType: 'blob' }).pipe(
      map((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a         = document.createElement('a');
        a.href          = objectUrl;
        a.download      = `bunian_financial_ledger.${ext}`;
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.error instanceof Blob) {
          return from(err.error.text()).pipe(
            switchMap((text) => {
              let message = 'تعذّر تصدير السجل المالي';
              try { message = JSON.parse(text)?.message ?? message; } catch { /* ignore parse errors */ }
              return throwError(() => new Error(message));
            }),
          );
        }
        return throwError(() => new Error(err.error?.message ?? 'تعذّر تصدير السجل المالي'));
      }),
    );
  }

  // ── Financial Obstacles (العوائق المالية) ──────────────────────
  getFinancialObstacles(status: FinancialObstacleStatus = 'open'): Observable<FinancialObstaclesResult> {
    let p = new HttpParams();
    if (status && status !== 'open') p = p.set('status', status);
    return this.http.get<ApiResponse<FinancialObstaclesResult>>(`${this.BASE}/obstacles/financial`, { params: p })
      .pipe(map(r => r.data));
  }

  fundObstacle(id: number, amount: number, notes?: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.BASE}/obstacles/${id}/fund`, { amount, notes })
      .pipe(map(() => void 0));
  }

  rejectObstacleFunding(id: number, reason: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.BASE}/obstacles/${id}/reject-funding`, { reason })
      .pipe(map(() => void 0));
  }
}
