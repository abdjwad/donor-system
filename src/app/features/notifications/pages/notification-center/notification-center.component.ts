import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';

interface Notification {
  id: number;
  type: 'donation' | 'project_update' | 'campaign' | 'system';
  titleAr: string; titleEn: string;
  bodyAr: string;  bodyEn: string;
  time: string;
  read: boolean;
  icon: string;
}

const MOCK: Notification[] = [
  { id: 1, type: 'donation',       titleAr: 'تم استلام تبرعك بنجاح',              titleEn: 'Donation received',
    bodyAr: 'تبرعك بمبلغ $50 لمشروع إعادة بناء المنازل تم تأكيده.',             bodyEn: 'Your $50 donation to Home Rebuilding was confirmed.',
    time: '2025-05-10T10:00:00', read: false, icon: 'volunteer_activism' },
  { id: 2, type: 'project_update', titleAr: 'تحديث: مشروع مدرسة الأمل',          titleEn: 'Update: Hope School Project',
    bodyAr: 'اكتمل 75% من مشروع مدرسة الأمل في حمص.',                          bodyEn: 'Hope School in Homs is 75% complete.',
    time: '2025-05-09T14:30:00', read: false, icon: 'construction' },
  { id: 3, type: 'campaign',       titleAr: 'حملة رمضان: يومان متبقيان',         titleEn: 'Ramadan Campaign: 2 days left',
    bodyAr: 'تبقى يومان على انتهاء حملة رمضان. ساهم الآن!',                    bodyEn: 'Only 2 days left for the Ramadan Campaign.',
    time: '2025-05-08T08:00:00', read: true,  icon: 'campaign' },
  { id: 4, type: 'system',         titleAr: 'مرحباً بك في منصة بنيان',           titleEn: 'Welcome to Bunian Platform',
    bodyAr: 'شكراً لتسجيلك. يمكنك الآن تصفح المشاريع والتبرع.',               bodyEn: 'Thank you for registering. Browse projects and donate.',
    time: '2025-05-07T12:00:00', read: true,  icon: 'info' },
  { id: 5, type: 'donation',       titleAr: 'إيصال تبرعك جاهز للتحميل',         titleEn: 'Your receipt is ready',
    bodyAr: 'يمكنك تحميل إيصال تبرعك بمبلغ $100 من سجل التبرعات.',            bodyEn: 'Your $100 donation receipt is available in history.',
    time: '2025-05-06T09:00:00', read: true,  icon: 'receipt' },
];

interface Settings { email: boolean; donations: boolean; projects: boolean; campaigns: boolean; system: boolean; }

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, MatSlideToggleModule, FormsModule, NavbarComponent, SiteFooterComponent],
  templateUrl: './notification-center.component.html',
  styleUrl:    './notification-center.component.scss',
})
export class NotificationCenterComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  activeTab  = signal<'list' | 'settings'>('list');
  filter     = signal<'all' | 'unread' | 'read'>('all');
  notifications = signal<Notification[]>(MOCK);

  settings: Settings = { email: true, donations: true, projects: true, campaigns: false, system: true };

  readonly filtered = computed(() => {
    const f = this.filter(), list = this.notifications();
    if (f === 'unread') return list.filter(n => !n.read);
    if (f === 'read')   return list.filter(n =>  n.read);
    return list;
  });

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  setFilter(f: string): void { this.filter.set(f as 'all' | 'unread' | 'read'); }

  markRead(id: number): void {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  getTitle(n: Notification): string   { return this.isRtl() ? n.titleAr : n.titleEn; }
  getBody(n: Notification): string    { return this.isRtl() ? n.bodyAr  : n.bodyEn;  }
  formatTime(iso: string): string {
    return new Date(iso).toLocaleDateString(this.isRtl() ? 'ar-SY' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  saveSettings(): void { /* backend call here */ }
}
