import { Component, EventEmitter, inject, OnInit, Output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { DonationService } from '../../services/donation.service';
import { Project } from '../../../../core/models/project.model';
import { DonationType } from '../../../../core/models/guest-donation.model';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100] as const;

@Component({
  selector: 'app-donation-amount-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './donation-amount-form.component.html',
  styleUrl: './donation-amount-form.component.scss',
})
export class DonationAmountFormComponent implements OnInit {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly donationService = inject(DonationService);

  readonly quickAmounts = QUICK_AMOUNTS;
  readonly selectedAmount = signal<number | null>(null);
  readonly isCustom = signal(false);
  readonly projects = signal<Project[]>([]);
  readonly charCount = signal(0);
  readonly maxChars = 200;
  readonly remainingChars = computed(() => this.maxChars - this.charCount());

  readonly form: FormGroup = this.fb.group({
    customAmount: [''],
    donation_type: ['one_time'],
    project_id: [null],
    dedication_message: [''],
  });

  ngOnInit(): void {
    const state = this.donationService.donationState();
    if (state.amount) {
      if (this.quickAmounts.includes(state.amount as typeof QUICK_AMOUNTS[number])) {
        this.selectedAmount.set(state.amount);
      } else {
        this.isCustom.set(true);
        this.form.patchValue({ customAmount: state.amount });
      }
    }
    if (state.donation_type) this.form.patchValue({ donation_type: state.donation_type });
    if (state.project_id)   this.form.patchValue({ project_id: state.project_id });
    if (state.dedication_message) {
      this.form.patchValue({ dedication_message: state.dedication_message });
      this.charCount.set(state.dedication_message.length);
    }

    this.donationService.getProjects().subscribe((projects) => {
      this.projects.set(projects);
    });

    this.form.get('dedication_message')!.valueChanges.subscribe((val: string) => {
      this.charCount.set((val ?? '').length);
    });
  }

  selectQuick(amount: number): void {
    this.selectedAmount.set(amount);
    this.isCustom.set(false);
    this.form.get('customAmount')!.setValue('');
  }

  selectCustom(): void {
    this.isCustom.set(true);
    this.selectedAmount.set(null);
  }

  getAmount(): number | null {
    if (this.isCustom()) {
      const v = parseFloat(this.form.value.customAmount);
      return isNaN(v) ? null : v;
    }
    return this.selectedAmount();
  }

  onNext(): void {
    const amount = this.getAmount();
    if (!amount || amount < 1) {
      return;
    }
    this.donationService.updateState({
      amount,
      donation_type: this.form.value.donation_type as DonationType,
      project_id: this.form.value.project_id ?? undefined,
      dedication_message: this.form.value.dedication_message || undefined,
    });
    this.next.emit();
  }

  onBack(): void {
    this.back.emit();
  }

  get hasValidAmount(): boolean {
    const a = this.getAmount();
    return a !== null && a >= 1;
  }
}
