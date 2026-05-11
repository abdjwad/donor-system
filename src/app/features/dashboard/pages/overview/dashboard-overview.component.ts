import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { ProjectCardComponent } from '../../../projects/components/project-card/project-card.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';
import { MOCK_PROJECTS } from '../../../home/data/mock-data';

const MOCK_RECENT = [
  { id: 1, date: '2025-05-01', projectAr: 'إعادة بناء منازل في حلب', projectEn: 'Homes in Aleppo', amount: 50, method: 'Stripe', status: 'completed' },
  { id: 2, date: '2025-04-15', projectAr: 'الصندوق العام', projectEn: 'General Fund', amount: 25, method: 'PayPal', status: 'completed' },
  { id: 3, date: '2025-03-22', projectAr: 'مدرسة الأمل في حمص', projectEn: 'Hope School — Homs', amount: 100, method: 'Stripe', status: 'completed' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, typeIcon: 'check_circle', color: '#27AE60', textAr: 'تم قبول تبرعك لمشروع حلب', textEn: 'Your donation to Aleppo project was accepted', time: '2h' },
  { id: 2, typeIcon: 'trending_up', color: '#C5952A', textAr: 'مشروع حلب وصل 80% من هدفه', textEn: 'Aleppo project reached 80% of its goal', time: '1d' },
  { id: 3, typeIcon: 'celebration', color: '#1B6B3A', textAr: 'مشروع حمص اكتمل!', textEn: 'Homs project completed!', time: '3d' },
];

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatIconModule,
            NavbarComponent, SiteFooterComponent, ProjectCardComponent, DashSidebarComponent],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly recentDonations = MOCK_RECENT;
  readonly notifications = MOCK_NOTIFICATIONS;
  readonly savedProjects = MOCK_PROJECTS.slice(0, 3);

  readonly stats = { totalDonated: 175, projectsSupported: 3, familiesHelped: 42, donationsCount: 3 };

  getProject(d: typeof MOCK_RECENT[0]): string { return this.isRtl() ? d.projectAr : d.projectEn; }
  getNotifText(n: typeof MOCK_NOTIFICATIONS[0]): string { return this.isRtl() ? n.textAr : n.textEn; }
}
