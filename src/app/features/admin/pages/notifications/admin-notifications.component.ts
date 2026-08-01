import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { NotificationsApiService } from '../../../../core/services/notifications-api.service';
import { AppNotification, notificationIcon } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [DatePipe, TranslateModule, MatButtonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrl:    './admin-notifications.component.scss',
})
export class AdminNotificationsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly notificationsApi = inject(NotificationsApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly loading = signal(true);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.readAt).length);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.notificationsApi.getNotifications().subscribe({
      next: (page) => { this.notifications.set(page.notifications); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

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
}
