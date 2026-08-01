import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService }     from '../../../../core/services/auth.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';
import { DonationService } from '../../../donate/services/donation.service';
import { NotificationsApiService } from '../../../../core/services/notifications-api.service';
import { AppNotification, notificationIcon } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule, MatButtonModule, MatIconModule,
            NavbarComponent, SiteFooterComponent, DashSidebarComponent],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent implements OnInit {
  private readonly langService     = inject(LanguageService);
  private readonly authService     = inject(AuthService);
  private readonly donationService = inject(DonationService);
  private readonly notificationsApi = inject(NotificationsApiService);

  readonly isRtl    = computed(() => this.langService.currentLang() === 'ar');
  readonly userName = computed(() => this.authService.currentUser()?.name ?? '');
  readonly loading  = signal(true);

  readonly stats = signal({
    total_donated:       0,
    donations_count:     0,
    projects_supported:  0,
    families_helped:     0,
  });

  readonly recentDonations  = signal<any[]>([]);
  readonly notifications    = signal<AppNotification[]>([]);

  ngOnInit(): void {
    this.donationService.getDashboardStats().subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.donationService.getHistory(1).subscribe({
      next: (data) => this.recentDonations.set(data.data?.slice(0, 3) ?? []),
      error: () => {},
    });

    this.notificationsApi.getNotifications().subscribe({
      next: (page) => this.notifications.set(page.notifications.slice(0, 5)),
      error: () => {},
    });
  }

  getProject(d: any): string {
    return this.isRtl() ? (d.project?.title_ar ?? 'الصندوق العام') : (d.project?.title_en ?? 'General Fund');
  }

  getNotifText(n: AppNotification): string { return n.messageAr; }
  notifIcon(n: AppNotification): string { return notificationIcon(n); }
}
