import { computed, inject, Injectable, signal } from '@angular/core';
import { RepairProjectsApiService } from '../../../core/services/repair-projects-api.service';
import {
  AdvancedSearchParams,
  ProjectsFilterOptions,
  ProjectsStatistics,
  RepairProject,
} from '../../../core/models/repair-project.model';

export type FundingStatusFilter = 'all' | 'needs_funding' | 'completed';

export interface RepairFilterState {
  fundingStatus: FundingStatusFilter;
  damageType: string;
  city: string;
}

const DEFAULT_FILTERS: RepairFilterState = { fundingStatus: 'needs_funding', damageType: '', city: '' };
const DEFAULT_SORT_BY = 'created_at';
const DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'desc';
const DEFAULT_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class ProjectsFilterService {
  private readonly api = inject(RepairProjectsApiService);

  // ── State ──────────────────────────────────────────────────────
  readonly filters = signal<RepairFilterState>({ ...DEFAULT_FILTERS });
  readonly search = signal('');
  readonly sortBy = signal(DEFAULT_SORT_BY);
  readonly sortDirection = signal<'asc' | 'desc'>(DEFAULT_SORT_DIRECTION);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly loading = signal(false);
  readonly filterOptionsLoading = signal(false);

  // ── API data ───────────────────────────────────────────────────
  readonly projects = signal<RepairProject[]>([]);
  readonly statistics = signal<ProjectsStatistics>({ total: 0 });
  readonly filterOptions = signal<ProjectsFilterOptions | null>(null);

  readonly totalCount = computed(() => this.statistics().total);
  readonly totalPages = computed(() => this.statistics().lastPage ?? 1);

  // للـ paginated نستخدم projects مباشرة
  readonly paginated = this.projects;

  // ── Load filter options (مرة واحدة) ───────────────────────────
  loadFilterOptions(): void {
    if (this.filterOptions() || this.filterOptionsLoading()) return;
    this.filterOptionsLoading.set(true);
    this.api.getFilterOptions().subscribe({
      next: (opts) => {
        this.filterOptions.set(opts);
        this.filterOptionsLoading.set(false);
      },
      error: () => this.filterOptionsLoading.set(false),
    });
  }

  // ── Load projects ──────────────────────────────────────────────
  load(): void {
    this.loading.set(true);

    this.api.advancedSearch(this.buildParams()).subscribe({
      next: (res) => {
        this.projects.set(res.projects);
        this.statistics.set(res.statistics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildParams(): AdvancedSearchParams {
    const f = this.filters();
    return {
      city: f.city || undefined,
      damage_type: f.damageType || undefined,
      funding_status: f.fundingStatus !== 'all' ? f.fundingStatus : undefined,
      sort_by: this.sortBy(),
      sort_direction: this.sortDirection(),
      per_page: this.pageSize(),
      page: this.page(),
      search: this.search() || undefined,
    };
  }

  // ── Filter actions ─────────────────────────────────────────────
  setSearch(q: string): void {
    this.search.set(q);
    this.page.set(1);
    this.load();
  }

  setFundingStatus(fundingStatus: FundingStatusFilter): void {
    this.filters.update((f) => ({ ...f, fundingStatus }));
    this.page.set(1);
    this.load();
  }

  setDamageType(damageType: string): void {
    this.filters.update((f) => ({ ...f, damageType }));
    this.page.set(1);
    this.load();
  }

  setCity(city: string): void {
    this.filters.update((f) => ({ ...f, city }));
    this.page.set(1);
    this.load();
  }

  setSort(sortBy: string): void {
    this.sortBy.set(sortBy);
    this.page.set(1);
    this.load();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.page.set(1);
    this.load();
  }

  setPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  reset(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.search.set('');
    this.sortBy.set(DEFAULT_SORT_BY);
    this.sortDirection.set(DEFAULT_SORT_DIRECTION);
    this.page.set(1);
    this.load();
  }
}
