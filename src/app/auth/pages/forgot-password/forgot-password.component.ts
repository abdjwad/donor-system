import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { applyAuthError } from '../../../core/utils/auth-error.util';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = this.authService.isLoading;
  readonly apiError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailCtrl() { return this.form.get('email')!; }

  getEmailError(): string {
    if (this.emailCtrl.hasError('required')) return 'AUTH.ERRORS.EMAIL_REQUIRED';
    if (this.emailCtrl.hasError('email'))    return 'AUTH.ERRORS.EMAIL_INVALID';
    return '';
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email;
    this.authService.forgotPassword({ email }).subscribe({
      // ننقل المستخدم مباشرة لصفحة إدخال الرمز — ما في رابط ينضغط، الرمز بيوصل
      // بالإيميل والمستخدم بيدخله يدوياً هون
      next: () => this.router.navigate(['/auth/reset-password'], { queryParams: { email } }),
      error: (err: HttpErrorResponse) => {
        const bannerKey = applyAuthError(err, this.form);
        if (bannerKey) this.apiError.set(bannerKey);
      },
    });
  }
}
