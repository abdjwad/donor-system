import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { SocialLoginButtonsComponent } from '../../../shared/components/social-login-buttons/social-login-buttons.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SocialLoginButtonsComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly apiError = signal<string | null>(null);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false],
  });

  get emailCtrl() { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  getEmailError(): string {
    if (this.emailCtrl.hasError('required')) return 'AUTH.ERRORS.EMAIL_REQUIRED';
    if (this.emailCtrl.hasError('email')) return 'AUTH.ERRORS.EMAIL_INVALID';
    if (this.emailCtrl.hasError('serverError')) return this.emailCtrl.getError('serverError');
    return '';
  }

  getPasswordError(): string {
    if (this.passwordCtrl.hasError('required')) return 'AUTH.ERRORS.PASSWORD_REQUIRED';
    if (this.passwordCtrl.hasError('minlength')) return 'AUTH.ERRORS.PASSWORD_MIN';
    if (this.passwordCtrl.hasError('serverError')) return this.passwordCtrl.getError('serverError');
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.loginForm.value;
    this.authService.login({ email, password, remember }).subscribe({
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  onSocialLogin(provider: 'google' | 'facebook'): void {
    // Social login: in production, obtain the provider token from
    // the Google Identity SDK, then pass it to authService.socialLogin()
    console.log('Social login via:', provider);
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 422 && err.error?.errors) {
      const errors: Record<string, string[]> = err.error.errors;
      Object.entries(errors).forEach(([field, messages]) => {
        this.loginForm.get(field)?.setErrors({ serverError: messages[0] });
      });
    } else {
      this.apiError.set(err.error?.message ?? 'AUTH.ERRORS.GENERIC');
    }
  }
}
