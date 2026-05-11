import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-social-login-buttons',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './social-login-buttons.component.html',
  styleUrl: './social-login-buttons.component.scss',
})
export class SocialLoginButtonsComponent {
  @Output() socialLogin = new EventEmitter<'google' | 'facebook'>();

  onGoogleClick(): void {
    this.socialLogin.emit('google');
  }
}
