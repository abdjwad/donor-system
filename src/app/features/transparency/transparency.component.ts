import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../core/services/language.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../home/components/site-footer/site-footer.component';
import { ProjectCardComponent } from '../projects/components/project-card/project-card.component';
import { MOCK_PROJECTS } from '../home/data/mock-data';

const SPENDING_BREAKDOWN = [
  { labelAr: 'الإسكان',       labelEn: 'Housing',         pct: 42, color: '#1B6B3A' },
  { labelAr: 'الصحة',         labelEn: 'Health',           pct: 23, color: '#C5952A' },
  { labelAr: 'التعليم',       labelEn: 'Education',        pct: 18, color: '#1A2D5A' },
  { labelAr: 'المياه',        labelEn: 'Water',            pct: 10, color: '#2E8B57' },
  { labelAr: 'بنية تحتية',   labelEn: 'Infrastructure',   pct:  7, color: '#7F8C8D' },
];

const REPORTS_LIST = [
  { titleAr: 'التقرير المالي الربع الثاني 2025', titleEn: 'Q2 2025 Financial Report', date: '2025-07-01', size: '2.4 MB' },
  { titleAr: 'التقرير المالي الربع الأول 2025',  titleEn: 'Q1 2025 Financial Report', date: '2025-04-01', size: '2.1 MB' },
  { titleAr: 'التقرير السنوي 2024',              titleEn: 'Annual Report 2024',        date: '2025-01-15', size: '5.8 MB' },
];

@Component({
  selector: 'app-transparency',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule,
            NavbarComponent, SiteFooterComponent, ProjectCardComponent],
  templateUrl: './transparency.component.html',
  styleUrl:    './transparency.component.scss',
})
export class TransparencyComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly breakdown         = SPENDING_BREAKDOWN;
  readonly reports           = REPORTS_LIST;
  readonly completedProjects = MOCK_PROJECTS.filter((p) => p.status === 'completed');

  readonly stats = { totalReceived: 2400000, totalSpent: 1980000, activeProjects: 10, completedProjects: 2, beneficiaries: 3200 };

  getLabel(item: { labelAr: string; labelEn: string }): string { return this.isRtl() ? item.labelAr : item.labelEn; }
  getTitle(r:    { titleAr: string; titleEn: string }): string { return this.isRtl() ? r.titleAr    : r.titleEn;    }
  formatM(n: number): string { return '$' + (n / 1_000_000).toFixed(1) + 'M'; }
}
