import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OtpInputComponent,
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  @Input() id = '';
  @Input() hash = '';
  @Input() email = '';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isLoading = this.authService.isLoading;
  readonly apiError = signal<string | null>(null);
  readonly resendCooldown = signal(60);
  readonly canResend = computed(() => this.resendCooldown() === 0);

  readonly form: FormGroup = this.fb.group({
    otp: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[0-9]{6}$/),
      ],
    ],
  });

  get otpCtrl() { return this.form.get('otp')!; }

  ngOnInit(): void {
    this.startCooldown();
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService
      .verifyEmail(this.id, this.hash, this.form.value.otp)
      .subscribe({
        error: (err: HttpErrorResponse) => {
          this.apiError.set(err.error?.message ?? 'AUTH.ERRORS.GENERIC');
        },
      });
  }

  onResend(): void {
    if (!this.canResend()) return;
    this.resendCooldown.set(60);
    this.startCooldown();

    const emailToUse = this.email || '';
    this.authService.resendVerification(emailToUse).subscribe({
      error: (err: HttpErrorResponse) => {
        this.apiError.set(err.error?.message ?? 'AUTH.ERRORS.GENERIC');
      },
    });
  }

  private startCooldown(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const interval = setInterval(() => {
      this.resendCooldown.update((v) => {
        if (v <= 1) {
          clearInterval(interval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }
}
