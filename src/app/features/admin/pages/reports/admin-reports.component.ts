import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, AdminReport, ReportSummary } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    TranslateModule, FormsModule, DecimalPipe,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrl:    './admin-reports.component.scss',
})
export class AdminReportsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl   = computed(() => this.langService.currentLang() === 'ar');
  readonly reports = signal<AdminReport[]>([]);
  readonly summary = signal<ReportSummary>({ total_count: 0, total_amount: 0, total_donors: 0 });
  readonly loading = signal(true);
  readonly error   = signal(false);
  readonly downloadingKey  = signal<string | null>(null);
  readonly downloadError   = signal<string | null>(null);

  dateFrom   = '';
  dateTo     = '';
  typeFilter = 'all';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi.getReports({
      dateFrom: this.dateFrom || undefined,
      dateTo:   this.dateTo   || undefined,
      type:     this.typeFilter,
    }).subscribe({
      next:  (res) => {
        this.reports.set(res.reports);
        this.summary.set(res.summary);
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  applyFilters(): void { this.load(); }

  resetFilters(): void {
    this.dateFrom   = '';
    this.dateTo     = '';
    this.typeFilter = 'all';
    this.load();
  }

  title(r: AdminReport): string { return this.isRtl() ? r.title_ar : r.title_en; }

  typeLabel(r: AdminReport): string {
    const labels: Record<string, { ar: string; en: string }> = {
      monthly:   { ar: 'شهري',   en: 'Monthly' },
      quarterly: { ar: 'ربعي',   en: 'Quarterly' },
      annual:    { ar: 'سنوي',   en: 'Annual' },
    };
    return this.isRtl() ? (labels[r.type]?.ar ?? r.type) : (labels[r.type]?.en ?? r.type);
  }

  isDownloading(r: AdminReport, format: 'pdf' | 'excel' | 'csv'): boolean {
    return this.downloadingKey() === `${r.id}-${format}`;
  }

  download(r: AdminReport, format: 'pdf' | 'excel' | 'csv'): void {
    this.downloadError.set(null);
    this.downloadingKey.set(`${r.id}-${format}`);
    this.adminApi.exportReport(r.type, r.period, format).subscribe({
      next: () => this.downloadingKey.set(null),
      error: (err: Error) => {
        this.downloadingKey.set(null);
        this.downloadError.set(err.message);
      },
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.dateFrom || this.dateTo || this.typeFilter !== 'all');
  }

  get filterLabel(): string {
    if (this.dateFrom && this.dateTo)
      return this.isRtl() ? `${this.dateFrom} — ${this.dateTo}` : `${this.dateFrom} — ${this.dateTo}`;
    if (this.dateFrom) return this.isRtl() ? `من ${this.dateFrom}` : `From ${this.dateFrom}`;
    if (this.dateTo)   return this.isRtl() ? `حتى ${this.dateTo}` : `Until ${this.dateTo}`;
    return this.isRtl() ? 'كل الفترات' : 'All periods';
  }
}
