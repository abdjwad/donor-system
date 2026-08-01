import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService }  from '../../../../core/services/language.service';
import { AdminApiService, AdminCategory, AdminOverview, AdminRecentDonation } from '../../../../core/services/admin-api.service';

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#1B6B3A', education: '#C5952A', health: '#1A2D5A',
  infrastructure: '#2E8B57', water: '#7A5810',
};
const CATEGORY_AR: Record<string, string> = {
  housing: 'إسكان', education: 'تعليم', health: 'صحة',
  infrastructure: 'بنية تحتية', water: 'مياه',
};

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './admin-overview.component.html',
  styleUrl:    './admin-overview.component.scss',
})
export class AdminOverviewComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl   = computed(() => this.langService.currentLang() === 'ar');
  readonly loading = signal(true);

  stats      = signal<{ key: string; icon: string; value: string; change: string }[]>([]);
  recent     = signal<AdminRecentDonation[]>([]);
  categories = signal<(AdminCategory & { pct: number; color: string; labelAr: string })[]>([]);

  ngOnInit(): void {
    this.adminApi.getOverview().subscribe({
      next: (data: AdminOverview) => {
        const s = data.stats;
        this.stats.set([
          { key: 'TOTAL_DONATIONS', icon: 'paid',            value: '$' + this.fmt(s.total_donations), change: '' },
          { key: 'TOTAL_DONORS',    icon: 'group',           value: String(s.total_donors),            change: '' },
          { key: 'ACTIVE_PROJECTS', icon: 'construction',    value: String(s.active_projects),         change: '' },
          { key: 'PENDING_REFUNDS', icon: 'pending_actions', value: String(s.pending_refunds),         change: '' },
        ]);
        this.recent.set(data.recent_donations);
        const totalFunding = data.by_category.reduce((sum, c) => sum + c.total, 0) || 1;
        this.categories.set(data.by_category.map(c => ({
          ...c,
          pct:     Math.round((c.total / totalFunding) * 100),
          color:   CATEGORY_COLORS[c.category] ?? '#888',
          labelAr: CATEGORY_AR[c.category] ?? c.category,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  donorName(r: AdminRecentDonation): string   { return r.name; }
  projectName(r: AdminRecentDonation): string { return this.isRtl() ? r.project_ar : r.project_en; }
  catLabel(c: { labelAr: string; category: string }): string { return this.isRtl() ? c.labelAr : c.category; }

  private fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }
}
