import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
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
import { PaymentMethod } from '../../../../core/models/guest-donation.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent implements OnInit {
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly donationService = inject(DonationService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly selectedMethod = signal<PaymentMethod>('stripe');

  readonly cardForm: FormGroup = this.fb.group({
    cardNumber: ['', Validators.required],
    cardExpiry: ['', Validators.required],
    cardCvv:    ['', Validators.required],
    cardName:   ['', Validators.required],
    terms:      [false, Validators.requiredTrue],
  });

  readonly bankForm: FormGroup = this.fb.group({
    iban:     ['', Validators.required],
    bankName: ['', Validators.required],
    terms:    [false, Validators.requiredTrue],
  });

  readonly paypalForm: FormGroup = this.fb.group({
    terms: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    this.donationService.updateState({ payment_method: 'stripe' });
  }

  selectMethod(method: PaymentMethod, tabIndex: number): void {
    const methods: PaymentMethod[] = ['stripe', 'paypal', 'bank'];
    this.selectedMethod.set(methods[tabIndex] ?? 'stripe');
    this.donationService.updateState({ payment_method: this.selectedMethod() });
    this.apiError.set(null);
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
    const payload = {
      name: state.name,
      email: state.email!,
      phone: state.phone,
      amount: state.amount!,
      currency: state.currency ?? 'USD',
      project_id: state.project_id,
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
      case 'paypal': return this.paypalForm;
      case 'bank':   return this.bankForm;
      default:       return this.cardForm;
    }
  }

  get activeTermsCtrl() {
    return this.getActiveForm().get('terms')!;
  }
}
