import { Component, EventEmitter, computed, inject, OnInit, Output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DonationService } from '../../services/donation.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TokenService } from '../../../../core/services/token.service';
import { DonorWalletApiService } from '../../../../core/services/donor-wallet-api.service';
import { GuestDonation, PaymentMethod, WalletInfo } from '../../../../core/models/guest-donation.model';
import { DonorWalletBalance } from '../../../../core/models/donor-wallet.model';
import { CryptoPaymentComponent } from '../crypto-payment/crypto-payment.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslateModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CryptoPaymentComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent implements OnInit {
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly donationService = inject(DonationService);
  private readonly walletApi = inject(DonorWalletApiService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly langService = inject(LanguageService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly isLoading = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly selectedMethod = signal<PaymentMethod>('stripe');
  readonly isAuthenticated = computed(() => this.tokenService.hasToken());

  readonly walletForm: FormGroup = this.fb.group({
    terms: [false, Validators.requiredTrue],
  });
  readonly walletBalance = signal<DonorWalletBalance | null>(null);
  readonly walletBalanceLoading = signal(false);

  readonly cardForm: FormGroup = this.fb.group({
    cardNumber: ['', Validators.required],
    cardExpiry: ['', Validators.required],
    cardCvv:    ['', Validators.required],
    cardName:   ['', Validators.required],
    terms:      [false, Validators.requiredTrue],
  });

  readonly bankForm: FormGroup = this.fb.group({
    terms: [false, Validators.requiredTrue],
  });

  readonly wallet = signal<WalletInfo | null>(null);
  readonly walletLoading = signal(false);

  // الترتيب لازم يطابق ترتيب التابات الفعلي بالـ HTML تماماً (Card, Bank, [Wallet], Crypto)
  readonly availableMethods = computed<PaymentMethod[]>(() =>
    this.isAuthenticated() ? ['stripe', 'bank', 'wallet', 'crypto'] : ['stripe', 'bank', 'crypto']
  );

  ngOnInit(): void {
    this.donationService.updateState({ payment_method: 'stripe' });
  }

  selectMethod(method: PaymentMethod, tabIndex: number): void {
    this.selectedMethod.set(this.availableMethods()[tabIndex] ?? 'stripe');
    this.donationService.updateState({ payment_method: this.selectedMethod() });
    this.apiError.set(null);

    if (this.selectedMethod() === 'bank' && !this.wallet() && !this.walletLoading()) {
      this.walletLoading.set(true);
      this.donationService.getActiveWallet().subscribe({
        next: (w) => { this.wallet.set(w); this.walletLoading.set(false); },
        error: () => this.walletLoading.set(false),
      });
    }

    if (this.selectedMethod() === 'wallet' && !this.walletBalance() && !this.walletBalanceLoading()) {
      this.walletBalanceLoading.set(true);
      this.walletApi.getBalance().subscribe({
        next: (b) => { this.walletBalance.set(b); this.walletBalanceLoading.set(false); },
        error: () => this.walletBalanceLoading.set(false),
      });
    }
  }

  get isCrypto(): boolean { return this.selectedMethod() === 'crypto'; }

  get insufficientWalletBalance(): boolean {
    if (this.selectedMethod() !== 'wallet') return false;
    const balance = this.walletBalance()?.balance ?? 0;
    const amount  = this.donationService.donationState().amount ?? 0;
    return amount > balance;
  }

  onBack(): void {
    this.back.emit();
  }

  onSubmit(): void {
    this.apiError.set(null);
    const activeForm = this.getActiveForm();
    if (activeForm.invalid) {
      activeForm.markAllAsTouched();
      return;
    }

    const state = this.donationService.donationState();

    if (this.selectedMethod() === 'wallet') {
      if (this.insufficientWalletBalance) {
        this.apiError.set(this.isRtl() ? 'رصيد المحفظة غير كافٍ لإتمام هذا التبرع' : 'Insufficient wallet balance for this donation');
        return;
      }

      this.isLoading.set(true);
      this.walletApi.donateFromWallet({
        amount: state.amount!,
        project_id: state.project_id,
        campaign_id: state.campaign_id,
        donation_type: state.donation_type ?? 'one_time',
        is_anonymous: state.is_anonymous ?? false,
        dedication_message: state.dedication_message,
      }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.donationService.resetState();
          this.router.navigate(['/donate/success'], {
            queryParams: { amount: res.amount, ref: res.reference },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.apiError.set(err.error?.message ?? 'DONATE.ERRORS.GENERIC');
        },
      });
      return;
    }

    // متبرع مسجّل دخول — نربط التبرع بحسابه (authenticatedDonate) حتى يظهر بسجله ولوحته الشخصية،
    // بدل ما ينحفظ كتبرع ضيف بدون user_id مهما كانت طريقة الدفع
    if (this.isAuthenticated()) {
      this.isLoading.set(true);
      this.donationService.submitAuthDonation({
        amount: state.amount!,
        project_id: state.project_id,
        campaign_id: state.campaign_id,
        donation_type: state.donation_type ?? 'one_time',
        payment_method: this.selectedMethod(),
        is_anonymous: state.is_anonymous ?? false,
        dedication_message: state.dedication_message,
      }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.donationService.resetState();
          this.router.navigate(['/donate/success'], {
            queryParams: { amount: state.amount, ref: res.reference },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.apiError.set(err.error?.message ?? 'DONATE.ERRORS.GENERIC');
        },
      });
      return;
    }

    const payload: GuestDonation = {
      name: state.name || (state.is_anonymous ? 'Anonymous' : ''),
      email: state.email!,
      phone: state.phone,
      amount: state.amount!,
      currency: state.currency ?? 'USD',
      project_id: state.project_id,
      campaign_id: state.campaign_id,
      donation_type: state.donation_type ?? 'one_time',
      payment_method: this.selectedMethod(),
      is_anonymous: state.is_anonymous ?? false,
      dedication_message: state.dedication_message,
    };

    this.isLoading.set(true);
    this.donationService.submitGuestDonation(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.donationService.resetState();
        this.router.navigate(['/donate/success'], {
          queryParams: { amount: payload.amount, ref: res.reference },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.apiError.set(err.error?.message ?? 'DONATE.ERRORS.GENERIC');
      },
    });
  }

  private getActiveForm(): FormGroup {
    switch (this.selectedMethod()) {
      case 'bank':   return this.bankForm;
      case 'wallet': return this.walletForm;
      default:       return this.cardForm;
    }
  }

  get activeTermsCtrl() {
    return this.getActiveForm().get('terms')!;
  }
}
