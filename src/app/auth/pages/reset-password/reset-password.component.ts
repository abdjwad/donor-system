import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { applyAuthError } from '../../../core/utils/auth-error.util';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  // Auto-bound via withComponentInputBinding() في إعدادات الراوتر — واصل من صفحة
  // "نسيت كلمة السر" مباشرة عبر التنقّل الداخلي، مو من رابط بالإيميل
  @Input() email = '';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly isSuccess = signal(false);
  readonly resent = signal(false);

  readonly form: FormGroup = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  get codeCtrl()     { return this.form.get('code')!; }
  get passwordCtrl() { return this.form.get('password')!; }
  get confirmCtrl()  { return this.form.get('confirmPassword')!; }

  ngOnInit(): void {
    if (!this.email) {
      this.apiError.set('ابدأ من صفحة نسيت كلمة السر لطلب رمز جديد');
    }
  }

  getCodeError(): string {
    if (this.codeCtrl.hasError('required')) return 'AUTH.ERRORS.CODE_REQUIRED';
    if (this.codeCtrl.hasError('pattern'))   return 'AUTH.ERRORS.CODE_INVALID';
    return '';
  }

  resendCode(): void {
    if (!this.email) return;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => { this.resent.set(true); setTimeout(() => this.resent.set(false), 4000); },
    });
  }

  getPasswordError(): string {
    if (this.passwordCtrl.hasError('required'))  return 'AUTH.ERRORS.PASSWORD_REQUIRED';
    if (this.passwordCtrl.hasError('minlength')) return 'AUTH.ERRORS.PASSWORD_MIN';
    if (this.passwordCtrl.hasError('pattern'))   return 'AUTH.ERRORS.PASSWORD_PATTERN';
    return '';
  }

  getConfirmError(): string {
    if (this.confirmCtrl.hasError('required')) return 'AUTH.ERRORS.PASSWORD_REQUIRED';
    if (this.form.hasError('passwordMismatch')) return 'AUTH.ERRORS.PASSWORD_MISMATCH';
    return '';
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { code, password, confirmPassword } = this.form.value;
    this.authService
      .resetPassword({
        code,
        email: this.email,
        password,
        password_confirmation: confirmPassword,
      })
      .subscribe({
        next: () => this.isSuccess.set(true),
        error: (err: HttpErrorResponse) => {
          const bannerKey = applyAuthError(err, this.form);
          if (bannerKey) this.apiError.set(bannerKey);
        },
      });
  }
}
