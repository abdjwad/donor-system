import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, DecimalPipe],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly http        = inject(HttpClient);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly stats = signal({ donors: 0, families: 0, projects: 0, totalAmount: 0 });

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/home/stats`).subscribe({
      next: (res) => {
        const d = res.data ?? res;
        this.stats.set({
          donors:      d.donors      ?? 0,
          families:    d.families    ?? 0,
          projects:    d.projects    ?? 0,
          totalAmount: d.totalAmount ?? d.total_amount ?? 0,
        });
      },
    });
  }
}
