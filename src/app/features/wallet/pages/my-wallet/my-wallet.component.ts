import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LanguageService } from '../../../../core/services/language.service';
import { DonorWalletApiService } from '../../../../core/services/donor-wallet-api.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';
import { DonorWalletBalance, WalletTopup, WalletTopupResponse } from '../../../../core/models/donor-wallet.model';
import { PaymentMethod } from '../../../../core/models/guest-donation.model';

@Component({
  selector: 'app-my-wallet',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, DecimalPipe, TranslateModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, NavbarComponent, SiteFooterComponent, DashSidebarComponent,
  ],
  templateUrl: './my-wallet.component.html',
  styleUrl: './my-wallet.component.scss',
})
export class MyWalletComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly walletApi    = inject(DonorWalletApiService);
  private readonly fb           = inject(FormBuilder);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly balance      = signal<DonorWalletBalance | null>(null);
  readonly loadingBalance = signal(true);
  readonly topups       = signal<WalletTopup[]>([]);
  readonly loadingTopups = signal(true);

  readonly showTopupForm = signal(false);
  readonly topupAmount   = signal<number | null>(null);
  readonly selectedMethod = signal<PaymentMethod>('bank');
  readonly creating      = signal(false);
  readonly createError   = signal<string | null>(null);
  readonly activeTopup   = signal<WalletTopupResponse | null>(null);

  readonly confirmForm: FormGroup = this.fb.group({
    bank_transfer_reference: ['', Validators.required],
  });
  readonly receiptFile  = signal<File | null>(null);
  readonly receiptError = signal<string | null>(null);
  readonly confirming   = signal(false);
  readonly confirmError = signal<string | null>(null);
  readonly confirmed    = signal(false);

  // Stripe مخفي مؤقتاً — السيرفر الحالي يحظر الاتصال بـapi.stripe.com
  readonly methods: PaymentMethod[] = ['bank', 'crypto'];

  ngOnInit(): void {
    this.loadBalance();
    this.loadTopups();
  }

  loadBalance(): void {
    this.loadingBalance.set(true);
    this.walletApi.getBalance().subscribe({
      next: (b) => { this.balance.set(b); this.loadingBalance.set(false); },
      error: () => this.loadingBalance.set(false),
    });
  }

  loadTopups(): void {
    this.loadingTopups.set(true);
    this.walletApi.getTopups().subscribe({
      next: (res) => { this.topups.set(res.data ?? []); this.loadingTopups.set(false); },
      error: () => this.loadingTopups.set(false),
    });
  }

  toggleTopupForm(): void {
    this.showTopupForm.update((v) => !v);
    if (!this.showTopupForm()) this.resetTopupForm();
  }

  resetTopupForm(): void {
    this.topupAmount.set(null);
    this.selectedMethod.set('bank');
    this.createError.set(null);
    this.activeTopup.set(null);
    this.confirmForm.reset();
    this.receiptFile.set(null);
    this.receiptError.set(null);
    this.confirmed.set(false);
    this.confirmError.set(null);
  }

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
  }

  submitTopup(): void {
    this.createError.set(null);
    const amount = this.topupAmount();
    if (!amount || amount < 1) {
      this.createError.set(this.isRtl() ? 'أدخل مبلغاً صحيحاً' : 'Enter a valid amount');
      return;
    }

    this.creating.set(true);
    this.walletApi.createTopup(amount, this.selectedMethod()).subscribe({
      next: (res) => { this.creating.set(false); this.activeTopup.set(res); this.loadTopups(); },
      error: (err: HttpErrorResponse) => {
        this.creating.set(false);
        this.createError.set(err.error?.message ?? (this.isRtl() ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong'));
      },
    });
  }

  get needsBankProof(): boolean {
    const t = this.activeTopup();
    return !!t && this.selectedMethod() === 'bank' && t.status === 'pending' && !this.confirmed();
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receiptFile.set(input.files?.[0] ?? null);
    this.receiptError.set(null);
  }

  submitTransferProof(): void {
    this.confirmError.set(null);
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }
    if (!this.receiptFile()) {
      this.receiptError.set(this.isRtl() ? 'يجب إرفاق صورة الإيصال' : 'You must attach the receipt image');
      return;
    }

    const reference = this.activeTopup()?.reference;
    if (!reference) return;

    this.confirming.set(true);
    this.walletApi.confirmTopupTransfer(reference, {
      bank_transfer_reference: this.confirmForm.value.bank_transfer_reference,
      receipt: this.receiptFile()!,
    }).subscribe({
      next: () => { this.confirming.set(false); this.confirmed.set(true); this.loadTopups(); },
      error: (err: HttpErrorResponse) => {
        this.confirming.set(false);
        this.confirmError.set(err.error?.message ?? (this.isRtl() ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong'));
      },
    });
  }

  statusLabel(status: string): string {
    const ar: Record<string, string> = { pending: 'قيد الانتظار', completed: 'مكتمل', failed: 'مرفوض' };
    const en: Record<string, string> = { pending: 'Pending', completed: 'Completed', failed: 'Rejected' };
    return this.isRtl() ? (ar[status] ?? status) : (en[status] ?? status);
  }

  methodLabel(method: string): string {
    const ar: Record<string, string> = { bank: 'تحويل بنكي', stripe: 'بطاقة ائتمان', paypal: 'PayPal', crypto: 'عملة رقمية' };
    const en: Record<string, string> = { bank: 'Bank Transfer', stripe: 'Card', paypal: 'PayPal', crypto: 'Crypto' };
    return this.isRtl() ? (ar[method] ?? method) : (en[method] ?? method);
  }
}
