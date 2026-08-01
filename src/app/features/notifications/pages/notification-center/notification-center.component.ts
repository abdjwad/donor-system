import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { NotificationsApiService } from '../../../../core/services/notifications-api.service';
import { AppNotification, notificationIcon } from '../../../../core/models/notification.model';

interface Settings { email: boolean; donations: boolean; projects: boolean; campaigns: boolean; system: boolean; }

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, MatSlideToggleModule, FormsModule, NavbarComponent, SiteFooterComponent],
  templateUrl: './notification-center.component.html',
  styleUrl:    './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  private readonly langService     = inject(LanguageService);
  private readonly notificationsApi = inject(NotificationsApiService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  activeTab  = signal<'list' | 'settings'>('list');
  filter     = signal<'all' | 'unread' | 'read'>('all');
  loading    = signal(true);
  notifications = signal<AppNotification[]>([]);

  settings: Settings = { email: true, donations: true, projects: true, campaigns: false, system: true };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notificationsApi.getNotifications().subscribe({
      next: (page) => { this.notifications.set(page.notifications); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  readonly filtered = computed(() => {
    const f = this.filter(), list = this.notifications();
    if (f === 'unread') return list.filter(n => !n.readAt);
    if (f === 'read')   return list.filter(n =>  n.readAt);
    return list;
  });

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.readAt).length);

  setFilter(f: string): void { this.filter.set(f as 'all' | 'unread' | 'read'); }

  markRead(id: string): void {
    const n = this.notifications().find(x => x.id === id);
    if (!n || n.readAt) return;
    this.notificationsApi.markAsRead(id).subscribe(() => {
      this.notifications.update(list => list.map(x => x.id === id ? { ...x, readAt: new Date().toISOString() } : x));
    });
  }

  markAllRead(): void {
    this.notificationsApi.markAllAsRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    });
  }

  icon(n: AppNotification): string { return notificationIcon(n); }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleDateString(this.isRtl() ? 'ar-SY' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  saveSettings(): void { /* backend call here */ }
}
