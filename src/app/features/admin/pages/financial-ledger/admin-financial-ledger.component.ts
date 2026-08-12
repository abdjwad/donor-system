import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../core/services/language.service';
import {
  AdminApiService,
  LedgerRow,
  LedgerSummary,
  LedgerType,
} from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-financial-ledger',
  standalone: true,
  imports: [TranslateModule, FormsModule, DecimalPipe, MatButtonModule, MatIconModule],
  templateUrl: './admin-financial-ledger.component.html',
  styleUrl:    './admin-financial-ledger.component.scss',
})
export class AdminFinancialLedgerComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  rows     = signal<LedgerRow[]>([]);
  summary  = signal<LedgerSummary>({ count: 0, total_in: 0, total_out: 0, net: 0, by_type: {} });
  total    = signal(0);
  page     = signal(1);
  perPage  = 20;
  loading  = signal(true);
  error    = signal<string | null>(null);

  downloadingFormat = signal<'pdf' | 'excel' | 'csv' | null>(null);
  downloadError     = signal<string | null>(null);

  typeFilter = signal<LedgerType>('all');
  dateFrom   = '';
  dateTo     = '';
  search     = '';

  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.perPage)));

  ngOnInit(): void {
    // افتراضياً آخر 30 يوم — نفس الحد يلي الباك اند بيطبّقه لو ما في تاريخ محدَّد،
    // فقط لعرضه بوضوح بحقول الفلترة
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.dateTo   = to.toISOString().slice(0, 10);
    this.dateFrom = from.toISOString().slice(0, 10);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getFinancialLedger({
      date_from: this.dateFrom || undefined,
      date_to:   this.dateTo   || undefined,
      type:      this.typeFilter(),
      search:    this.search.trim() || undefined,
      page:      this.page(),
      per_page:  this.perPage,
    }).subscribe({
      next: (res) => {
        this.rows.set(res.data);
        this.summary.set(res.summary);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || (this.isRtl() ? 'تعذّر تحميل السجل المالي' : 'Failed to load ledger'));
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.dateTo   = to.toISOString().slice(0, 10);
    this.dateFrom = from.toISOString().slice(0, 10);
    this.search   = '';
    this.typeFilter.set('all');
    this.page.set(1);
    this.load();
  }

  setType(type: LedgerType): void {
    this.typeFilter.set(type);
    this.applyFilters();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update(p => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.lastPage()) return;
    this.page.update(p => p + 1);
    this.load();
  }

  download(format: 'pdf' | 'excel' | 'csv'): void {
    this.downloadError.set(null);
    this.downloadingFormat.set(format);
    this.adminApi.exportFinancialLedger({
      date_from: this.dateFrom || undefined,
      date_to:   this.dateTo   || undefined,
      type:      this.typeFilter(),
      search:    this.search.trim() || undefined,
    }, format).subscribe({
      next: () => this.downloadingFormat.set(null),
      error: (err: Error) => {
        this.downloadingFormat.set(null);
        this.downloadError.set(err.message);
      },
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, { ar: string; en: string }> = {
      donation:         { ar: 'تبرع',           en: 'Donation' },
      wallet_topup:     { ar: 'شحن محفظة',      en: 'Wallet Top-up' },
      refund:           { ar: 'استرداد',        en: 'Refund' },
      disbursement:     { ar: 'صرف دفعة',       en: 'Disbursement' },
      obstacle_funding: { ar: 'تمويل عائق',     en: 'Obstacle Funding' },
    };
    return this.isRtl() ? (labels[type]?.ar ?? type) : (labels[type]?.en ?? type);
  }

  isDownloading(format: 'pdf' | 'excel' | 'csv'): boolean {
    return this.downloadingFormat() === format;
  }
}
