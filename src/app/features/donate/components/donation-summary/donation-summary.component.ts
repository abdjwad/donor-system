import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { DonationService } from '../../services/donation.service';

@Component({
  selector: 'app-donation-summary',
  standalone: true,
  imports: [TranslateModule, CurrencyPipe],
  templateUrl: './donation-summary.component.html',
  styleUrl: './donation-summary.component.scss',
})
export class DonationSummaryComponent {
  private readonly donationService = inject(DonationService);

  readonly state = this.donationService.donationState;

  readonly displayAmount = computed(() => {
    const s = this.state();
    return s.amount ? s.amount : null;
  });

  readonly donorName = computed(() => {
    const s = this.state();
    if (s.is_anonymous) return null;
    return s.name || null;
  });

  readonly isMonthly = computed(() => this.state().donation_type === 'recurring');
}
