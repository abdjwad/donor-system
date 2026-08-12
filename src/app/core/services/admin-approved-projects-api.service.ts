import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth-response.models';
import {
  ApprovedProject,
  ApprovedProjectBeneficiary,
  ApprovedProjectsResult,
  ApprovedProjectsStatistics,
  ProjectDetailOverview,
  ProjectDisplayUpdate,
} from '../models/approved-project.model';

@Injectable({ providedIn: 'root' })
export class AdminApprovedProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin`; 

  getApprovedProjects(status?: string): Observable<ApprovedProjectsResult> {
    const params: Record<string, string> = status && status !== 'all' ? { status } : {};
    return this.http
      .get<ApiResponse<any>>(`${this.API}/approved-projects`, { params })
      .pipe(map((res) => this.mapResult(res.data)));
  }

  updateProjectDisplay(id: number, payload: ProjectDisplayUpdate): Observable<ApprovedProject> {
    return this.http
      .put<ApiResponse<any>>(`${this.API}/approved-projects/${id}/display`, payload)
      .pipe(map((res) => this.mapProject(res.data)));
  }

  getProjectDetails(id: number): Observable<ProjectDetailOverview> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/approved-projects/${id}`)
      .pipe(map((res) => this.mapDetail(res.data)));
  }

  private mapDetail(raw: any): ProjectDetailOverview {
    const p = raw.project ?? {};
    const b = raw.beneficiary ?? {};
    return {
      project: {
        id: p.id,
        requestNumber: p.request_number ?? '',
        location: p.location ?? '',
        damageType: p.damage_type ?? '',
        description: p.description ?? null,
        priority: p.priority ?? null,
        status: p.status ?? '',
        estimatedCost: p.estimated_cost !== null && p.estimated_cost !== undefined ? Number(p.estimated_cost) : null,
        totalEstimatedCost: p.total_estimated_cost !== null && p.total_estimated_cost !== undefined ? Number(p.total_estimated_cost) : null,
        createdAt: p.created_at ?? '',
        approvedAt: p.approved_at ?? null,
      },
      beneficiary: {
        id: b.id, name: b.name ?? '', email: b.email ?? '', phone: b.phone ?? '',
        gender: b.gender ?? null, birthDate: b.birth_date ?? null,
        occupation: b.occupation ?? null, employmentType: b.employment_type ?? null,
      },
      items: ((raw.project_items ?? []) as any[]).map((i) => ({
        id: i.id, itemName: i.item_name, quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price), totalPrice: Number(i.total_price),
        notes: i.notes ?? null, createdAt: i.created_at,
      })),
      approvedBy: raw.approved_by ? { id: raw.approved_by.id, name: raw.approved_by.name } : null,
    };
  }

  private mapResult(raw: any): ApprovedProjectsResult {
    return {
      statistics: this.mapStatistics(raw.statistics ?? {}),
      projects: ((raw.projects ?? []) as any[]).map((p) => this.mapProject(p)),
    };
  }

  private mapStatistics(raw: any): ApprovedProjectsStatistics {
    return {
      total: Number(raw.total ?? 0),
      totalCost: Number(raw.total_cost ?? 0),
      highPriority: Number(raw.high_priority ?? 0),
      mediumPriority: Number(raw.medium_priority ?? 0),
      lowPriority: Number(raw.low_priority ?? 0),
    };
  }

  private mapBeneficiary(raw: any): ApprovedProjectBeneficiary {
    return {
      id: raw?.id ?? 0,
      name: raw?.name ?? '',
      phone: raw?.phone ?? '',
    };
  }

  private mapProject(raw: any): ApprovedProject {
    return {
      id: raw.id,
      requestNumber: raw.request_number ?? '',
      location: raw.location ?? '',
      damageType: raw.damage_type ?? '',
      priority: raw.priority !== null && raw.priority !== undefined ? Number(raw.priority) : null,
      totalEstimatedCost:
        raw.total_estimated_cost !== null && raw.total_estimated_cost !== undefined
          ? Number(raw.total_estimated_cost)
          : null,
      status: raw.status ?? '',
      createdAt: raw.created_at ?? '',
      beneficiary: this.mapBeneficiary(raw.beneficiary),
      titleAr: raw.title_ar ?? null,
      titleEn: raw.title_en ?? null,
      descriptionEn: raw.description_en ?? null,
      category: raw.category ?? null,
      donorsCount: Number(raw.donors_count ?? 0),
      fundingProgress: Number(raw.funding_progress ?? 0),
      collectedAmount: Number(raw.collected_amount ?? 0),
      hasContractor: !!raw.has_contractor,
      contractorName: raw.contractor_name ?? null,
    };
  }
}
