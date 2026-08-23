import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';
import { DonationService } from '../../services/donation.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DonationType } from '../../../../core/models/guest-donation.model';

@Component({
  selector: 'app-general-fund',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, MatButtonModule, MatTabsModule,
            MatFormFieldModule, MatInputModule, MatCheckboxModule, MatIconModule,
            NavbarComponent, SiteFooterComponent],
  templateUrl: './general-fund.component.html',
  styleUrl: './general-fund.component.scss',
})
export class GeneralFundComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly langService = inject(LanguageService);
  private readonly donationService = inject(DonationService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly QUICK_AMOUNTS = [10, 25, 50, 100, 250] as const;
  readonly RECURRING_TYPES: DonationType[] = ['one_time', 'recurring'];

  selectedAmount = signal<number>(25);
  isCustom = signal(false);
  recurringType = signal<DonationType>('one_time');

  readonly form: FormGroup = this.fb.group({
    customAmount: [''],
    terms: [false, Validators.requiredTrue],
  });

  select(a: number): void { this.selectedAmount.set(a); this.isCustom.set(false); }
  selectCustom(): void { this.isCustom.set(true); this.selectedAmount.set(0); }
  setRecurring(t: DonationType): void { this.recurringType.set(t); }

  getAmount(): number {
    if (this.isCustom()) return parseFloat(this.form.value.customAmount) || 0;
    return this.selectedAmount();
  }

  get canSubmit(): boolean { return this.form.get('terms')!.value && this.getAmount() >= 1; }

  // بدل ما نعمل تبرع "وهمي" بمرجع مُختلَق محلياً بدون أي سجل حقيقي بالباك اند —
  // ننقل مبلغ ونوع التبرع المُختارين هون لنفس مسار التبرع الحقيقي والمُختبَر
  // (/donate/guest)، بدون أي مشروع محدَّد (يبقى صندوق عام)، فيكمّل الدفع بنفس
  // النموذج الموثوق (بيانات المتبرع، طرق الدفع، إيميل حقيقي، رقم مرجع حقيقي)
  submit(): void {
    if (!this.canSubmit) return;
    this.donationService.updateState({
      amount: this.getAmount(),
      donation_type: this.recurringType(),
      project_id: undefined,
      campaign_id: undefined,
    });
    this.router.navigate(['/donate/guest']);
  }
}
