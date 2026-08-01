import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Campaign, Project } from '../models/project.model';
import { ApiResponse } from '../models/auth-response.models';

const FALLBACK_IMAGE = 'assets/images/project-placeholder.svg';

export interface ProjectsApiResponse {
  data: Project[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
}

export interface ProjectFilters {
  search?:   string;
  category?: string;
  urgency?:  string;
  location?: string;
  sort?:     string;
  per_page?: number;
  page?:     number;
}

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly API  = `${environment.apiUrl}/v1`;

  private featured$?: Observable<Project[]>;

  getProjects(filters: ProjectFilters = {}): Observable<ProjectsApiResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects`, { params })
      .pipe(map((res) => ({
        data: (res.data.data as any[]).map(p => this.mapProject(p)),
        meta: res.data.meta,
      })));
  }

  getProject(id: number): Observable<Project> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/projects/${id}`)
      .pipe(map((res) => this.mapProject(res.data)));
  }

  getFeatured(): Observable<Project[]> {
    if (!this.featured$) {
      this.featured$ = this.http
        .get<ApiResponse<any[]>>(`${this.API}/projects/featured`)
        .pipe(
          map((res) => (res.data as any[]).map(p => this.mapProject(p))),
          shareReplay(1),
        );
    }
    return this.featured$;
  }

  private mapProject(raw: any): Project {
    return {
      id:            raw.id,
      title:         raw.title_en ?? raw.title_ar ?? '',
      titleAr:       raw.title_ar ?? '',
      description:   raw.description_en,
      descriptionAr: raw.description_ar,
      location:      raw.location_en ?? raw.location_ar ?? '',
      locationAr:    raw.location_ar,
      imageUrl:      raw.image_url ?? FALLBACK_IMAGE,
      images:        Array.isArray(raw.images) ? raw.images : [],
      fundingGoal:   Number(raw.funding_goal ?? 0),
      amountRaised:  Number(raw.amount_raised ?? 0),
      donors:        raw.donors_count ?? 0,
      status:        raw.status,
      category:      raw.category,
      urgency:       raw.urgency,
      daysActive:    raw.days_active ?? 0,
      featured:      false,
      requestNumber:   raw.request_number,
      damageType:      raw.damage_type,
      priority:        raw.priority ?? null,
      beneficiaryName: raw.beneficiary?.name,
      beneficiaryFamilySize: raw.beneficiary?.family_size,
      costBreakdown: Array.isArray(raw.cost_breakdown)
        ? raw.cost_breakdown.map((i: any) => ({
            itemName:   i.item_name,
            quantity:   Number(i.quantity ?? 0),
            unitPrice:  Number(i.unit_price ?? 0),
            totalPrice: Number(i.total_price ?? 0),
          }))
        : undefined,
    };
  }

  getCampaigns(): Observable<Campaign[]> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/campaigns`)
      .pipe(map((res) => (res.data.data as any[]).map(c => this.mapCampaign(c))));
  }

  getCampaign(id: number): Observable<Campaign> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/campaigns/${id}`)
      .pipe(map((res) => {
        const c = this.mapCampaign(res.data);
        if (res.data.projects) {
          c.projects = (res.data.projects as any[]).map(p => this.mapProject(p));
        }
        return c;
      }));
  }

  private mapCampaign(raw: any): Campaign {
    return {
      id:            raw.id,
      title:         raw.title_en ?? raw.title_ar ?? '',
      titleAr:       raw.title_ar ?? '',
      description:   raw.description_en ?? '',
      descriptionAr: raw.description_ar ?? '',
      imageUrl:      raw.image_url ?? FALLBACK_IMAGE,
      targetAmount:  Number(raw.funding_goal ?? 0),
      raisedAmount:  Number(raw.amount_raised ?? 0),
      daysLeft:      raw.days_left ?? 0,
      donorCount:    raw.donors_count ?? 0,
      isUrgent:      raw.is_urgent ?? false,
      featured:      false,
      projects:      [],
    };
  }
}
