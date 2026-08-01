import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService }     from '../../../../core/services/auth.service';
import { CertificateService } from '../../../../shared/services/certificate.service';
import { DonationService } from '../../services/donation.service';
import { GuestDonationResponse } from '../../../../core/models/guest-donation.model';

@Component({
  selector: 'app-donation-success',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './donation-success.component.html',
  styleUrl: './donation-success.component.scss',
})
export class DonationSuccessComponent implements OnInit {
  @Input() amount = '';
  @Input() ref    = '';
  @Input() project = '';

  private readonly langService  = inject(LanguageService);
  private readonly authService  = inject(AuthService);
  private readonly certService  = inject(CertificateService);
  private readonly donationApi  = inject(DonationService);
  private readonly fb           = inject(FormBuilder);

  readonly isRtl      = computed(() => this.langService.currentLang() === 'ar');
  readonly generating = signal(false);

  readonly loading   = signal(true);
  readonly donation  = signal<GuestDonationResponse | null>(null);

  readonly confirmForm: FormGroup = this.fb.group({
    bank_transfer_reference: ['', Validators.required],
  });
  readonly receiptFile  = signal<File | null>(null);
  readonly receiptError = signal<string | null>(null);
  readonly confirming   = signal(false);
  readonly confirmError = signal<string | null>(null);
  readonly confirmed    = signal(false);

  ngOnInit(): void {
    if (!this.ref) { this.loading.set(false); return; }
    this.donationApi.getDonationByRef(this.ref).subscribe({
      next: (d) => { this.donation.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get needsBankProof(): boolean {
    const d = this.donation();
    return !!d && d.payment_method === 'bank' && d.status === 'pending' && !d.receipt_submitted_at && !this.confirmed();
  }

  get awaitingBankConfirmation(): boolean {
    const d = this.donation();
    return !!d && d.payment_method === 'bank' && d.status === 'pending' && (!!d.receipt_submitted_at || this.confirmed());
  }

  get isCompleted(): boolean {
    return this.donation()?.status === 'completed';
  }

  get isFailed(): boolean {
    return this.donation()?.status === 'failed';
  }

  get isProcessing(): boolean {
    const d = this.donation();
    return !!d && d.status === 'pending' && d.payment_method !== 'bank';
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

    this.confirming.set(true);
    this.donationApi.confirmBankTransfer(this.ref, {
      bank_transfer_reference: this.confirmForm.value.bank_transfer_reference,
      receipt: this.receiptFile()!,
    }).subscribe({
      next: () => { this.confirming.set(false); this.confirmed.set(true); },
      error: (err: HttpErrorResponse) => {
        this.confirming.set(false);
        this.confirmError.set(err.error?.message ?? (this.isRtl() ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again'));
      },
    });
  }

  async downloadCertificate(): Promise<void> {
    if (!this.amount || !this.ref) return;
    this.generating.set(true);
    try {
      await this.certService.download({
        donorName:   this.authService.currentUser()?.name ?? 'متبرع كريم',
        amount:      this.amount,
        projectName: this.project || (this.isRtl() ? 'الصندوق العام' : 'General Fund'),
        date:        new Date().toLocaleDateString('ar-SY'),
        reference:   this.ref,
      });
    } finally {
      this.generating.set(false);
    }
  }
}
