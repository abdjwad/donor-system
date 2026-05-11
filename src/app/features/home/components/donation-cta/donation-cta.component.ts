import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-donation-cta',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './donation-cta.component.html',
  styleUrl: './donation-cta.component.scss',
})
export class DonationCtaComponent {
  private readonly router = inject(Router);

  readonly amounts = [10, 25, 50, 100] as const;
  readonly selected = signal<number>(25);

  select(a: number): void { this.selected.set(a); }

  donate(): void {
    this.router.navigate(['/donate/guest'], {
      queryParams: { amount: this.selected() },
    });
  }
}
