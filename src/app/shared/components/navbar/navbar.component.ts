import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Web3Service } from '../../../core/services/web3.service';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { NotificationsApiService } from '../../../core/services/notifications-api.service';
import { BackButtonComponent } from '../back-button/back-button.component';
import { RefreshButtonComponent } from '../refresh-button/refresh-button.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, MatButtonModule, MatIconModule, BackButtonComponent, RefreshButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly langService     = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly authService     = inject(AuthService);
  private readonly tokenService    = inject(TokenService);
  private readonly notificationsApi = inject(NotificationsApiService);
  readonly web3   = inject(Web3Service);
  readonly isRtl  = computed(() => this.langService.currentLang() === 'ar');

  // reactive — يتحدث فور تغيير التوكن
  readonly isLoggedIn = this.tokenService.hasToken;
  readonly unreadNotifications = this.notificationsApi.unreadCount;

  menuOpen = false;

  ngOnInit(): void {
    if (this.tokenService.hasToken()) {
      this.notificationsApi.getNotifications().subscribe({ error: () => {} });
    }
    this.notificationsApi.startPolling();
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void  { this.menuOpen = false; }
  toggleLang(): void { this.langService.toggle(); }
  toggleTheme(): void { this.themeService.toggle(); }

  logout(): void {
    this.authService.logout().subscribe({
      error: () => {
        this.tokenService.clearToken();
        window.location.href = '/auth/login';
      }
    });
  }

  async connectWallet(): Promise<void> {
    try {
      await this.web3.connectWallet();
    } catch (err: any) {
      const code = this.web3.parseError(err);
      if (code === 'NO_METAMASK') {
        window.open('https://metamask.io/download/', '_blank');
      }
    }
  }

  get shortAddress(): string {
    const addr = this.web3.walletAddress();
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }
}
