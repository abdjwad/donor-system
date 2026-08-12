import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LanguageService } from '../../../../core/services/language.service';
import { TokenService } from '../../../../core/services/token.service';
import { DonationService } from '../../services/donation.service';
import { GuestInfoFormComponent } from '../../components/guest-info-form/guest-info-form.component';
import { DonationAmountFormComponent } from '../../components/donation-amount-form/donation-amount-form.component';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { DonationSummaryComponent } from '../../components/donation-summary/donation-summary.component';

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    GuestInfoFormComponent,
    DonationAmountFormComponent,
    PaymentFormComponent,
    DonationSummaryComponent,
  ],
  templateUrl: './guest-checkout.component.html',
  styleUrl: './guest-checkout.component.scss',
})
export class GuestCheckoutComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly langService = inject(LanguageService);
  private readonly tokenService = inject(TokenService);
  private readonly route = inject(ActivatedRoute);
  readonly donationService = inject(DonationService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly isLoggedIn = this.tokenService.hasToken;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['project']) {
        this.donationService.updateState({ project_id: +params['project'] });
      } else if (params['campaign']) {
        this.donationService.updateState({ campaign_id: +params['campaign'] });
      }
    });
  }

  onStep1Next(): void {
    this.stepper.next();
  }

  onStep2Next(): void {
    this.stepper.next();
  }

  onStep2Back(): void {
    this.stepper.previous();
  }

  onStep3Back(): void {
    this.stepper.previous();
  }
}
