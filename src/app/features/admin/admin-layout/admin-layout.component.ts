import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { NotificationsApiService } from '../../../core/services/notifications-api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, BackButtonComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl:    './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly notificationsApi = inject(NotificationsApiService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly unreadNotifications = this.notificationsApi.unreadCount;

  ngOnInit(): void {
    this.notificationsApi.getNotifications().subscribe({ error: () => {} });
    this.notificationsApi.startPolling();
  }

  toggleLang(): void { this.langService.toggle(); }
}
