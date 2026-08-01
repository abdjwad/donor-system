import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../core/services/language.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../home/components/site-footer/site-footer.component';

const CATEGORY_COLORS: Record<string,string> = {
  housing: '#1B6B3A', health: '#C5952A', education: '#1A2D5A',
  water: '#2E8B57', infrastructure: '#7F8C8D',
};

const CATEGORY_AR: Record<string,string> = {
  housing: 'الإسكان', health: 'الصحة', education: 'التعليم',
  water: 'المياه', infrastructure: 'بنية تحتية',
};

@Component({
  selector: 'app-transparency',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule,
            NavbarComponent, SiteFooterComponent],
  templateUrl: './transparency.component.html',
  styleUrl:    './transparency.component.scss',
})
export class TransparencyComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly http        = inject(HttpClient);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly stats = signal({
    total_received:     0,
    total_spent:        0,
    active_projects:    0,
    completed_projects: 0,
    unique_donors:      0,
    beneficiaries:      0,
  });

  readonly breakdown         = signal<any[]>([]);
  readonly reports           = signal<any[]>([]);
  readonly recentTransactions = signal<any[]>([]);
  readonly completedProjects = signal<any[]>([]);

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/transparency/stats`)
      .pipe(map(r => r.data), catchError(() => of(null)))
      .subscribe(data => {
        if (!data) return;
        this.stats.set(data.stats);
        this.reports.set(data.reports ?? []);
        this.recentTransactions.set(data.recent_transactions ?? []);

        // بناء breakdown مع الألوان
        const totalAmount = data.breakdown?.reduce((s: number, b: any) => s + b.amount, 0) || 1;
        this.breakdown.set(
          (data.breakdown ?? []).map((b: any) => ({
            ...b,
            labelAr: CATEGORY_AR[b.category] ?? b.category,
            labelEn: b.category,
            pct:     Math.round((b.amount / totalAmount) * 100),
            color:   CATEGORY_COLORS[b.category] ?? '#7F8C8D',
          }))
        );
      });

    this.http.get<any>(`${environment.apiUrl}/v1/transparency/completed-projects`)
      .pipe(map(r => r.data ?? []), catchError(() => of([])))
      .subscribe(projects => this.completedProjects.set(projects));
  }

  getLabel(item: any): string { return this.isRtl() ? item.labelAr : item.labelEn; }
  getTitle(r: any): string    { return this.isRtl() ? r.title_ar   : r.title_en;   }
  getProjectTitle(p: any): string { return this.isRtl() ? p.title_ar : p.title_en; }
  formatM(n: number): string  { return n >= 1_000_000 ? '$' + (n/1_000_000).toFixed(1)+'M' : '$' + (n/1000).toFixed(0)+'K'; }
}
