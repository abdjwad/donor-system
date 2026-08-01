import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { MatRadioModule } from '@angular/material/radio';

import { AuthService } from '../../../core/services/auth.service';
import { SocialLoginButtonsComponent } from '../../../shared/components/social-login-buttons/social-login-buttons.component';
import { applyAuthError } from '../../../core/utils/auth-error.util';
import { OtpChannel } from '../../../core/models/auth-request.models';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
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
    MatRadioModule,
    SocialLoginButtonsComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly apiError = signal<string | null>(null);

  readonly registerForm: FormGroup = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(80),
          Validators.pattern(/^[؀-ۿݐ-ݿ a-zA-Z\s]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\+?[0-9\s\-]{9,15}$/),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
      otpChannel: ['email' as OtpChannel, Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  get nameCtrl()    { return this.registerForm.get('name')!; }
  get emailCtrl()   { return this.registerForm.get('email')!; }
  get phoneCtrl()   { return this.registerForm.get('phone')!; }
  get passwordCtrl(){ return this.registerForm.get('password')!; }
  get confirmCtrl() { return this.registerForm.get('confirmPassword')!; }
  get termsCtrl()   { return this.registerForm.get('terms')!; }
  get otpChannelCtrl() { return this.registerForm.get('otpChannel')!; }

  getNameError(): string {
    if (this.nameCtrl.hasError('required'))  return 'AUTH.ERRORS.NAME_REQUIRED';
    if (this.nameCtrl.hasError('minlength')) return 'AUTH.ERRORS.NAME_MIN';
    if (this.nameCtrl.hasError('pattern'))   return 'AUTH.ERRORS.NAME_PATTERN';
    if (this.nameCtrl.hasError('serverError')) return this.nameCtrl.getError('serverError');
    return '';
  }

  getEmailError(): string {
    if (this.emailCtrl.hasError('required')) return 'AUTH.ERRORS.EMAIL_REQUIRED';
    if (this.emailCtrl.hasError('email'))    return 'AUTH.ERRORS.EMAIL_INVALID';
    if (this.emailCtrl.hasError('serverError')) return this.emailCtrl.getError('serverError');
    return '';
  }

  getPhoneError(): string {
    if (this.phoneCtrl.hasError('required')) return 'AUTH.ERRORS.PHONE_REQUIRED';
    if (this.phoneCtrl.hasError('pattern'))  return 'AUTH.ERRORS.PHONE_INVALID';
    if (this.phoneCtrl.hasError('serverError')) return this.phoneCtrl.getError('serverError');
    return '';
  }

  getPasswordError(): string {
    if (this.passwordCtrl.hasError('required'))  return 'AUTH.ERRORS.PASSWORD_REQUIRED';
    if (this.passwordCtrl.hasError('minlength')) return 'AUTH.ERRORS.PASSWORD_MIN';
    if (this.passwordCtrl.hasError('pattern'))   return 'AUTH.ERRORS.PASSWORD_PATTERN';
    if (this.passwordCtrl.hasError('serverError')) return this.passwordCtrl.getError('serverError');
    return '';
  }

  getConfirmError(): string {
    if (this.confirmCtrl.hasError('required')) return 'AUTH.ERRORS.PASSWORD_REQUIRED';
    if (this.registerForm.hasError('passwordMismatch')) return 'AUTH.ERRORS.PASSWORD_MISMATCH';
    return '';
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, phone, password, confirmPassword, otpChannel } = this.registerForm.value;
    const channel: OtpChannel = otpChannel;

    this.authService.stagePendingRegistration({
      name,
      email,
      phone,
      password,
      password_confirmation: confirmPassword,
      terms: true,
      channel,
    });

    this.authService
      .sendOtp({ email, channel, phone: channel === 'whatsapp' ? phone : undefined })
      .subscribe({
        next: () => this.router.navigate(['/auth/verify-email'], { queryParams: { email } }),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  onSocialLogin(provider: 'google' | 'facebook'): void {
    console.log('Social login via:', provider);
  }

  private handleError(err: HttpErrorResponse): void {
    const bannerKey = applyAuthError(err, this.registerForm);
    if (bannerKey) this.apiError.set(bannerKey);
  }
}
