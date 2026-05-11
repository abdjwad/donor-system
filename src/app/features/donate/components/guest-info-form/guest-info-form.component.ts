import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { DonationService } from '../../services/donation.service';

@Component({
  selector: 'app-guest-info-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './guest-info-form.component.html',
  styleUrl: './guest-info-form.component.scss',
})
export class GuestInfoFormComponent implements OnInit {
  @Output() next = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly donationService = inject(DonationService);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^\+?[0-9\s\-]{9,15}$/)],
    is_anonymous: [false],
  });

  get nameCtrl()  { return this.form.get('name')!; }
  get emailCtrl() { return this.form.get('email')!; }
  get anonCtrl()  { return this.form.get('is_anonymous')!; }

  ngOnInit(): void {
    // Pre-fill from existing state
    const state = this.donationService.donationState();
    if (state.name)   this.form.patchValue({ name: state.name });
    if (state.email)  this.form.patchValue({ email: state.email });
    if (state.phone)  this.form.patchValue({ phone: state.phone });
    if (state.is_anonymous !== undefined) {
      this.form.patchValue({ is_anonymous: state.is_anonymous });
    }

    // When anonymous, name becomes optional
    this.anonCtrl.valueChanges.subscribe((anon: boolean) => {
      const nameCtrl = this.form.get('name')!;
      if (anon) {
        nameCtrl.clearValidators();
        nameCtrl.updateValueAndValidity();
      } else {
        nameCtrl.setValidators([Validators.required, Validators.minLength(3)]);
        nameCtrl.updateValueAndValidity();
      }
    });
  }

  onNext(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.donationService.updateState(this.form.value);
    this.next.emit();
  }

  getNameError(): string {
    if (this.nameCtrl.hasError('required'))  return 'DONATE.ERRORS.NAME_REQUIRED';
    if (this.nameCtrl.hasError('minlength')) return 'AUTH.ERRORS.NAME_MIN';
    return '';
  }

  getEmailError(): string {
    if (this.emailCtrl.hasError('required')) return 'DONATE.ERRORS.EMAIL_REQUIRED';
    if (this.emailCtrl.hasError('email'))    return 'DONATE.ERRORS.EMAIL_INVALID';
    return '';
  }
}
