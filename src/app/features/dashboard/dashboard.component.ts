import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="padding: 2rem; text-align: center; font-family: Cairo, sans-serif;">
      <h1 style="color: #1B6B3A;">لوحة التحكم</h1>
      <p style="color: #7F8C8D;">مرحباً بك في منصة بنيان</p>
      <button (click)="logout()"
              style="background:#1B6B3A;color:#fff;border:none;padding:0.75rem 2rem;border-radius:8px;cursor:pointer;font-size:1rem;">
        تسجيل الخروج
      </button>
    </div>
  `,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout().subscribe();
  }
}
