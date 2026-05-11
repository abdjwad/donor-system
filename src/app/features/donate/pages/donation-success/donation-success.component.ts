import { Component, computed, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-donation-success',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './donation-success.component.html',
  styleUrl: './donation-success.component.scss',
})
export class DonationSuccessComponent {
  @Input() amount = '';
  @Input() ref = '';

  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
}
