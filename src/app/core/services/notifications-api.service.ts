import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, filter, interval, map, of, switchMap, tap } from 'rxjs';
import { ApiResponse } from '../models/auth-response.models';
import { AppNotification, NotificationsPage } from '../models/notification.model';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

const POLL_INTERVAL_MS = 20000;

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  // ملاحظة: هاد الـ endpoint بدون بادئة /v1 — مختلف عن باقي الـ API (خاص بأي دور: متبرع أو أدمن)
  private readonly API = `${environment.apiUrl}/notifications`;

  /** يتحدّث تلقائياً بعد كل getNotifications/markAsRead/markAllAsRead — يُستخدم لشارة العدد بالقائمة الجانبية */
  readonly unreadCount = signal(0);

  /** يُستدعى عند تسجيل الخروج (اختياري أو إجباري بسبب 401) حتى لا تبقى شارة قديمة ظاهرة بعد فقدان الجلسة */
  resetState(): void {
    this.unreadCount.set(0);
  }

  private pollingStarted = false;

  /**
   * تحديث دوري (polling) لعدد الإشعارات غير المقروءة كل 20 ثانية طالما المستخدم مسجّل دخول.
   * آمن الاستدعاء أكثر من مرة (من أكثر من مكوّن) — بيبلش مرة واحدة بس لعمر الصفحة كله.
   */
  startPolling(): void {
    if (this.pollingStarted) return;
    this.pollingStarted = true;

    interval(POLL_INTERVAL_MS).pipe(
      filter(() => this.tokenService.hasToken()),
      switchMap(() => this.getNotifications().pipe(catchError(() => of(null)))),
    ).subscribe();
  }

  getNotifications(page = 1): Observable<NotificationsPage> {
    return this.http.get<ApiResponse<any>>(`${this.API}?page=${page}`).pipe(
      map((res) => ({
        unreadCount: res.data.unread_count ?? 0,
        notifications: (res.data.notifications?.data ?? []).map((n: any) => this.mapNotification(n)),
        total: res.data.notifications?.total ?? 0,
        currentPage: res.data.notifications?.current_page ?? 1,
        lastPage: res.data.notifications?.last_page ?? 1,
      })),
      tap((page) => this.unreadCount.set(page.unreadCount)),
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/${id}/read`, {}).pipe(
      map(() => void 0),
      tap(() => this.unreadCount.update((c) => Math.max(0, c - 1))),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.API}/read-all`, {}).pipe(
      map(() => void 0),
      tap(() => this.unreadCount.set(0)),
    );
  }

  private mapNotification(raw: any): AppNotification {
    return {
      id: raw.id,
      type: raw.data?.type ?? 'system',
      messageAr: raw.data?.message_ar ?? '',
      readAt: raw.read_at,
      createdAt: raw.created_at,
    };
  }
}
