import { Component, computed, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule],
  templateUrl: './payment-failed.component.html',
  styleUrl: './payment-failed.component.scss',
})
export class PaymentFailedComponent {
  @Input() reason = 'generic';
  @Input() amount = '';

  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
}
