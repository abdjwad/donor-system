import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService }     from '../../../core/services/auth.service';
import { TokenService }    from '../../../core/services/token.service';
import { NotificationsApiService } from '../../../core/services/notifications-api.service';

@Component({
  selector: 'app-dash-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './dash-sidebar.component.html',
  styleUrl: './dash-sidebar.component.scss',
})
export class DashSidebarComponent implements OnInit {
  private readonly langService     = inject(LanguageService);
  private readonly authService     = inject(AuthService);
  private readonly tokenService    = inject(TokenService);
  private readonly notificationsApi = inject(NotificationsApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly isAdmin      = computed(() => this.authService.canAccessAdmin());
  readonly canProjects  = computed(() => this.authService.hasPermission('view donations'));
  readonly canCampaigns = computed(() => this.authService.hasPermission('manage campaigns'));
  readonly canDonAdm    = computed(() => this.authService.hasPermission('manage donations'));
  readonly canRefunds   = computed(() => this.authService.hasPermission('manage donations'));

  readonly userName = computed(() => this.authService.currentUser()?.name ?? '');

  readonly unreadNotifications = this.notificationsApi.unreadCount;

  ngOnInit(): void {
    this.notificationsApi.getNotifications().subscribe({ error: () => {} });
    this.notificationsApi.startPolling();
  }

  logout(): void {
    this.authService.logout().subscribe({
      error: () => {
        this.tokenService.clearToken();
        window.location.href = '/auth/login';
      },
    });
  }
}
