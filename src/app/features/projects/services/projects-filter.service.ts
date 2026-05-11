import { computed, Injectable, signal } from '@angular/core';
import { Project, ProjectCategory, ProjectStatus, ProjectUrgency } from '../../../core/models/project.model';
import { MOCK_PROJECTS } from '../../home/data/mock-data';

export type SortOption = 'newest' | 'most_funded' | 'most_urgent' | 'near_complete';

export interface FilterState {
  status: ProjectStatus | 'all';
  categories: ProjectCategory[];
  locations: string[];
  urgencies: ProjectUrgency[];
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  categories: [],
  locations: [],
  urgencies: [],
};

@Injectable({ providedIn: 'root' })
export class ProjectsFilterService {
  readonly allProjects = MOCK_PROJECTS;
  readonly filters   = signal<FilterState>({ ...DEFAULT_FILTERS });
  readonly search    = signal('');
  readonly sortBy    = signal<SortOption>('newest');
  readonly page      = signal(1);
  readonly pageSize  = signal(12);

  readonly filtered = computed(() => {
    const f = this.filters();
    const q = this.search().toLowerCase().trim();

    return this.allProjects.filter((p) => {
      if (f.status !== 'all' && p.status !== f.status) return false;
      if (f.categories.length && !f.categories.includes(p.category)) return false;
      if (f.locations.length && !f.locations.includes(p.location)) return false;
      if (f.urgencies.length && !f.urgencies.includes(p.urgency)) return false;
      if (q) {
        const inTitle = p.titleAr.includes(q) || p.title.toLowerCase().includes(q);
        const inLocation = p.location.toLowerCase().includes(q) || (p.locationAr ?? '').includes(q);
        if (!inTitle && !inLocation) return false;
      }
      return true;
    });
  });

  readonly sorted = computed(() => {
    const list = [...this.filtered()];
    switch (this.sortBy()) {
      case 'most_funded':   return list.sort((a, b) => b.amountRaised - a.amountRaised);
      case 'most_urgent':   return list.sort((a, b) => this.urgencyScore(b) - this.urgencyScore(a));
      case 'near_complete': return list.sort((a, b) => this.pct(b) - this.pct(a));
      default:              return list.sort((a, b) => b.daysActive - a.daysActive);
    }
  });

  readonly totalCount = computed(() => this.sorted().length);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly uniqueLocations = computed(() =>
    [...new Set(this.allProjects.map((p) => p.location))].sort()
  );

  setSearch(q: string): void {
    this.search.set(q);
    this.page.set(1);
  }

  setSort(s: SortOption): void {
    this.sortBy.set(s);
    this.page.set(1);
  }

  setPage(p: number): void {
    this.page.set(p);
  }

  toggleCategory(cat: ProjectCategory): void {
    this.filters.update((f) => {
      const cats = f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat];
      return { ...f, categories: cats };
    });
    this.page.set(1);
  }

  toggleLocation(loc: string): void {
    this.filters.update((f) => {
      const locs = f.locations.includes(loc)
        ? f.locations.filter((l) => l !== loc)
        : [...f.locations, loc];
      return { ...f, locations: locs };
    });
    this.page.set(1);
  }

  toggleUrgency(urg: ProjectUrgency): void {
    this.filters.update((f) => {
      const urgs = f.urgencies.includes(urg)
        ? f.urgencies.filter((u) => u !== urg)
        : [...f.urgencies, urg];
      return { ...f, urgencies: urgs };
    });
    this.page.set(1);
  }

  setStatus(s: ProjectStatus | 'all'): void {
    this.filters.update((f) => ({ ...f, status: s }));
    this.page.set(1);
  }

  reset(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.search.set('');
    this.sortBy.set('newest');
    this.page.set(1);
  }

  private urgencyScore(p: Project): number {
    return p.urgency === 'high' ? 3 : p.urgency === 'medium' ? 2 : 1;
  }

  private pct(p: Project): number {
    return p.fundingGoal > 0 ? (p.amountRaised / p.fundingGoal) * 100 : 0;
  }
}
