import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';

const BEFORE_AFTER = [
  { beforeUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', afterUrl: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80', titleAr: 'منازل حلب القديمة', titleEn: 'Old Aleppo Homes' },
  { beforeUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80', afterUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80', titleAr: 'مدرسة حمص', titleEn: 'Homs School' },
];

const REPORTS = [
  { titleAr: 'تقرير الربع الأول 2025', titleEn: 'Q1 2025 Report', date: '2025-04-01', type: 'quarterly' },
  { titleAr: 'تقرير سنوي 2024', titleEn: 'Annual Report 2024', date: '2025-01-15', type: 'annual' },
  { titleAr: 'تقرير مشروع حلب', titleEn: 'Aleppo Project Report', date: '2025-03-10', type: 'project' },
];

@Component({
  selector: 'app-donation-impact',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, NavbarComponent, SiteFooterComponent, DashSidebarComponent],
  templateUrl: './donation-impact.component.html',
  styleUrl: './donation-impact.component.scss',
})
export class DonationImpactComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly beforeAfterItems = BEFORE_AFTER;
  readonly reports = REPORTS;

  readonly myStats = { families: 42, projects: 3, amount: 175 };

  getTitle(t: {titleAr: string; titleEn: string}): string { return this.isRtl() ? t.titleAr : t.titleEn; }
}
