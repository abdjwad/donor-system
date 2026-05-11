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
  // Auto-bound via withComponentInputBinding() in router config
  @Input() token = '';
  @Input() email = '';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly isSuccess = signal(false);

  readonly form: FormGroup = this.fb.group(
    {
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

  get passwordCtrl() { return this.form.get('password')!; }
  get confirmCtrl()  { return this.form.get('confirmPassword')!; }

  ngOnInit(): void {
    if (!this.token) {
      this.apiError.set('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
    }
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

    const { password, confirmPassword } = this.form.value;
    this.authService
      .resetPassword({
        token: this.token,
        email: this.email,
        password,
        password_confirmation: confirmPassword,
      })
      .subscribe({
        next: () => this.isSuccess.set(true),
        error: (err: HttpErrorResponse) => {
          if (err.status === 422 && err.error?.errors) {
            const errors: Record<string, string[]> = err.error.errors;
            Object.entries(errors).forEach(([field, messages]) => {
              this.form.get(field)?.setErrors({ serverError: messages[0] });
            });
          } else {
            this.apiError.set(err.error?.message ?? 'AUTH.ERRORS.GENERIC');
          }
        },
      });
  }
}
