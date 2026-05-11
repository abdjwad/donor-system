import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';

interface Report {
  id: number; titleAr: string; titleEn: string;
  period: string; type: 'quarterly'|'annual'|'monthly'; size: string; date: string;
}

const REPORTS: Report[] = [
  { id:1, titleAr:'التقرير المالي Q1 2025',   titleEn:'Financial Report Q1 2025',   period:'Q1 2025',     type:'quarterly', size:'2.4 MB', date:'2025-04-01' },
  { id:2, titleAr:'التقرير المالي Q4 2024',   titleEn:'Financial Report Q4 2024',   period:'Q4 2024',     type:'quarterly', size:'2.1 MB', date:'2025-01-01' },
  { id:3, titleAr:'التقرير السنوي 2024',      titleEn:'Annual Report 2024',          period:'Year 2024',   type:'annual',    size:'5.8 MB', date:'2025-02-01' },
  { id:4, titleAr:'تقرير إبريل 2025',         titleEn:'April 2025 Monthly Report',  period:'April 2025',  type:'monthly',   size:'1.2 MB', date:'2025-05-01' },
  { id:5, titleAr:'تقرير مارس 2025',          titleEn:'March 2025 Monthly Report',  period:'March 2025',  type:'monthly',   size:'1.1 MB', date:'2025-04-01' },
];

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './admin-reports.component.html',
  styleUrl:    './admin-reports.component.scss',
})
export class AdminReportsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly reports = REPORTS;

  title(r: Report): string { return this.isRtl() ? r.titleAr : r.titleEn; }
  typeKey(r: Report): string { return 'ADMIN.REPORTS.' + r.type.toUpperCase(); }
}
