import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth-response.models';
import {
  AdvancedSearchParams,
  CodeLabel,
  FundingCompletedProject,
  FundingCompletedResult,
  MilestoneStatus,
  NeedFundingProject,
  NeedFundingResult,
  ProjectMilestoneItem,
  ProjectProgress,
  ProjectsFilterOptions,
  ProjectsStatistics,
  RepairProject,
  RepairProjectsResult,
  SortOptionItem,
} from '../models/repair-project.model';

@Injectable({ providedIn: 'root' })
export class RepairProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl; // '/api' — بدون /v1

  getInProgressProjects(): Observable<RepairProjectsResult> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/in-progress`)
      .pipe(map((res) => this.mapResult(res.data)));
  }

  getNeedFundingProjects(): Observable<NeedFundingResult> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/need-funding`)
      .pipe(map((res) => this.mapNeedFundingResult(res.data)));
  }
  getFundingCompletedProjects(): Observable<FundingCompletedResult> {
    // route محمية (auth:sanctum + role) لأنها تكشف بيانات حساب المقاول البنكي —
    // تُستخدم فقط من صفحة الأدمن "إنشاء خطة صرف جديدة"
    return this.http
      .get<ApiResponse<any>>(`${this.API}/v1/admin/projects/funding-completed`)
      .pipe(map((res) => this.mapFundingCompletedResult(res.data)));
  }

  // عكس getFundingCompletedProjects: ممولة 100% بس بدون مقاول بعد — contractor
  // بتضل دايماً null لأنه أصلاً هاي فكرة القائمة (لسا ما تعيّن حدا)
  getProjectsAwaitingContractorAssignment(): Observable<FundingCompletedResult> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/v1/admin/projects/awaiting-contractor-assignment`)
      .pipe(map((res) => this.mapFundingCompletedResult(res.data)));
  }

  getFilterOptions(): Observable<ProjectsFilterOptions> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/filter-options`)
      .pipe(map((res) => this.mapFilterOptions(res.data)));
  }

  advancedSearch(params: AdvancedSearchParams): Observable<RepairProjectsResult> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/advanced-search`, { params: httpParams })
      .pipe(map((res) => this.mapResult(res.data)));
  }

  getProjectProgress(id: number): Observable<ProjectProgress> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/${id}/progress`)
      .pipe(map((res) => this.mapProgress(res.data)));
  }

  private mapProgress(raw: any): ProjectProgress {
    return {
      totalCompletion: Number(raw.project?.total_completion ?? 0),
      status: raw.project?.status ?? '',
      contractorName: raw.contractor?.name ?? null,
      roadmap: ((raw.roadmap ?? []) as any[]).map((m) => this.mapMilestone(m)),
    };
  }

  private mapMilestone(raw: any): ProjectMilestoneItem {
    return {
      id: raw.id,
      order: raw.order,
      name: raw.name ?? '',
      status: (raw.status ?? 'pending') as MilestoneStatus,
      completionPercentage: Number(raw.completion_percentage ?? 0),
      startedAt: raw.started_at ?? null,
      completedAt: raw.completed_at ?? null,
      latestUpdate: raw.latest_update ? {
        id: raw.latest_update.id,
        completionPercentage: Number(raw.latest_update.completion_percentage ?? 0),
        notes: raw.latest_update.notes ?? null,
        images: (raw.latest_update.images ?? []) as string[],
        status: raw.latest_update.status ?? '',
        createdAt: raw.latest_update.created_at ?? '',
      } : null,
    };
  }

  private mapResult(raw: any): RepairProjectsResult {
    return {
      statistics: this.mapStatistics(raw.statistics ?? {}),
      projects: ((raw.projects ?? []) as any[]).map((p) => this.mapProject(p)),
      filtersApplied: raw.filters_applied,
    };
  }

  private mapStatistics(raw: any): ProjectsStatistics {
    return {
      total: Number(raw.total ?? 0),
      avgCompletion: raw.avg_completion !== undefined ? Number(raw.avg_completion) : undefined,
      totalContractors: raw.total_contractors !== undefined ? Number(raw.total_contractors) : undefined,
      perPage: raw.per_page !== undefined ? Number(raw.per_page) : undefined,
      currentPage: raw.current_page !== undefined ? Number(raw.current_page) : undefined,
      lastPage: raw.last_page !== undefined ? Number(raw.last_page) : undefined,
    };
  }

  private mapCodeLabel(raw: any): CodeLabel {
    return { code: raw?.code ?? '', label: raw?.label ?? '' };
  }

  private mapNeedFundingResult(raw: any): NeedFundingResult {
    return {
      statistics: {
        totalProjects: Number(raw.statistics?.total_projects ?? 0),
        totalAmountNeeded: Number(raw.statistics?.total_amount_needed ?? 0),
        avgFundingProgress: Number(raw.statistics?.avg_funding_progress ?? 0),
      },
      projects: ((raw.projects ?? []) as any[]).map((p) => this.mapNeedFundingProject(p)),
    };
  }

  private mapNeedFundingProject(raw: any): NeedFundingProject {
    return {
      id: raw.id,
      requestNumber: raw.request_number ?? '',
      location: raw.location ?? '',
      damageType: this.mapCodeLabel(raw.damage_type),
      description: raw.description ?? '',
      totalEstimatedCost:
        raw.total_estimated_cost !== null && raw.total_estimated_cost !== undefined
          ? Number(raw.total_estimated_cost)
          : null,
      collectedAmount: Number(raw.collected_amount ?? 0),
      fundingProgress: Number(raw.funding_progress ?? 0),
      remainingAmount: Number(raw.remaining_amount ?? 0),
      priority: Number(raw.priority ?? 0),
      images: (raw.images ?? []) as string[],
      beneficiary: { name: raw.beneficiary?.name ?? '', city: raw.beneficiary?.city ?? '' },
      createdAt: raw.created_at ?? '',
    };
  }

  private mapProject(raw: any): RepairProject {
    return {
      id: raw.id,
      requestNumber: raw.request_number ?? '',
      title: raw.title_en ?? raw.title_ar ?? '',
      titleAr: raw.title_ar ?? '',
      location: raw.location ?? '',
      city: raw.city ?? '',
      damageType: this.mapCodeLabel(raw.damage_type),
      status: this.mapCodeLabel(raw.status),
      priority: Number(raw.priority ?? 0),
      totalEstimatedCost: Number(raw.total_estimated_cost ?? 0),
      fundingProgress: Number(raw.funding_progress ?? 0),
      collectedAmount: Number(raw.collected_amount ?? 0),
      completionPercentage: Number(raw.completion_percentage ?? 0),
      contractorName: raw.contractor_name ?? null,
      familySize: Number(raw.family_size ?? 0),
      createdAt: raw.created_at ?? '',
      thumbnail: raw.thumbnail ?? null,
    };
  }

  private mapFilterOptions(raw: any): ProjectsFilterOptions {
    return {
      cities: (raw.cities ?? []) as string[],
      damageTypes: ((raw.damage_types ?? []) as any[]).map((d) => this.mapCodeLabel(d)),
      sortOptions: ((raw.sort_options ?? []) as any[]).map((s) => ({
        value: s.value ?? '',
        label: s.label ?? '',
      } as SortOptionItem)),
    };
  }
    private mapFundingCompletedResult(raw: any): FundingCompletedResult {
    return {
      statistics: {
        totalProjects: Number(raw.statistics?.total_projects ?? 0),
        totalAmountReady: Number(raw.statistics?.total_amount_ready ?? 0),
      },
      projects: ((raw.projects ?? []) as any[]).map((p) => this.mapFundingCompletedProject(p)),
    };
  }

  private mapFundingCompletedProject(raw: any): FundingCompletedProject {
    return {
      id: raw.id,
      requestNumber: raw.request_number ?? '',
      location: raw.location ?? '',
      damageType: this.mapCodeLabel(raw.damage_type),
      description: raw.description ?? '',
      totalEstimatedCost:
        raw.total_estimated_cost !== null && raw.total_estimated_cost !== undefined
          ? Number(raw.total_estimated_cost)
          : null,
      collectedAmount: Number(raw.collected_amount ?? 0),
      fundingProgress: Number(raw.funding_progress ?? 0),
      priority: Number(raw.priority ?? 0),
      contractor: raw.contractor
        ? {
            id: raw.contractor.id,
            name: raw.contractor.name ?? '',
            companyName: raw.contractor.company_name ?? null,
            bankInfo: raw.contractor.bank_info
              ? {
                  bankName: raw.contractor.bank_info.bank_name ?? null,
                  accountName: raw.contractor.bank_info.account_name ?? null,
                  accountNumber: raw.contractor.bank_info.account_number ?? null,
                  iban: raw.contractor.bank_info.iban ?? null,
                }
              : null,
            hasBankInfo: !!raw.contractor.has_bank_info,
          }
        : null,
      images: (raw.images ?? []) as string[],
      beneficiary: { name: raw.beneficiary?.name ?? '', city: raw.beneficiary?.city ?? '' },
      milestones: ((raw.milestones ?? []) as any[]).map((m) => ({
        id: m.id,
        name: m.name ?? '',
        order: Number(m.order ?? 0),
      })),
      createdAt: raw.created_at ?? '',
    };
  }

}
