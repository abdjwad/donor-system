import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService }     from '../../../../core/services/auth.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';
import { DonationService } from '../../../donate/services/donation.service';
import { CertificateService } from '../../../../shared/services/certificate.service';
import { DonationHistoryItem, DonorDashboardStats } from '../../../../core/models/guest-donation.model';

@Component({
  selector: 'app-donation-history',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, MatSelectModule, DecimalPipe, SlicePipe,
            FormsModule, NavbarComponent, SiteFooterComponent, DashSidebarComponent],
  templateUrl: './donation-history.component.html',
  styleUrl: './donation-history.component.scss',
})
export class DonationHistoryComponent implements OnInit {
  private readonly langService      = inject(LanguageService);
  private readonly authService      = inject(AuthService);
  private readonly donationService  = inject(DonationService);
  private readonly certService      = inject(CertificateService);

  readonly generating = signal<number | null>(null);

  readonly isRtl        = computed(() => this.langService.currentLang() === 'ar');
  readonly loading       = signal(true);
  readonly allDonations  = signal<DonationHistoryItem[]>([]);
  readonly filterStatus  = signal<string>('all');
  readonly searchTerm    = signal('');
  readonly expandedId    = signal<number | null>(null);
  readonly currentPage   = signal(1);
  readonly lastPage      = signal(1);

  readonly refundFormOpenId = signal<number | null>(null);
  readonly refundReason     = signal('');
  readonly refundSubmitting = signal(false);
  readonly refundError      = signal<string | null>(null);

  readonly stats = signal<DonorDashboardStats>({
    total_donated: 0, total_refunded: 0, pending_count: 0,
    donations_count: 0, projects_supported: 0, families_helped: 0,
  });

  readonly donations = computed(() => {
    const status = this.filterStatus();
    const term   = this.searchTerm().trim().toLowerCase();
    let list = this.allDonations();

    if (status !== 'all') {
      list = list.filter(d => d.status === status);
    }
    if (term) {
      list = list.filter(d =>
        d.reference.toLowerCase().includes(term) ||
        this.getProject(d).toLowerCase().includes(term)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadPage(1);

    this.donationService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {},
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.donationService.getHistory(page).subscribe({
      next: (res) => {
        this.allDonations.set(res.data ?? []);
        this.currentPage.set(res.current_page ?? page);
        this.lastPage.set(res.last_page ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }

  getProject(d: DonationHistoryItem): string {
    const source = d.project ?? d.campaign;
    return this.isRtl()
      ? (source?.title_ar ?? 'الصندوق العام')
      : (source?.title_en ?? 'General Fund');
  }

  methodLabel(d: DonationHistoryItem): string {
    const labelsAr: Record<string, string> = {
      wallet: 'من المحفظة', bank: 'تحويل بنكي', stripe: 'بطاقة ائتمان', paypal: 'PayPal', crypto: 'عملة رقمية',
    };
    const labelsEn: Record<string, string> = {
      wallet: 'Wallet', bank: 'Bank Transfer', stripe: 'Card', paypal: 'PayPal', crypto: 'Crypto',
    };
    const key = d.payment_method;
    return this.isRtl() ? (labelsAr[key] ?? key) : (labelsEn[key] ?? key);
  }

  formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(this.isRtl() ? 'ar-SY' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  explorerUrl(d: DonationHistoryItem): string | null {
    if (!d.blockchain) return null;
    const network = d.blockchain.network;
    if (network === 'amoy') return `https://amoy.polygonscan.com/tx/${d.blockchain.tx_hash}`;
    if (network === 'polygon') return `https://polygonscan.com/tx/${d.blockchain.tx_hash}`;
    return null; // ganache محلية، ما إلها مستكشف عام
  }

  async downloadCertificate(d: DonationHistoryItem): Promise<void> {
    this.generating.set(d.id);
    try {
      await this.certService.download({
        donorName:   this.authService.currentUser()?.name ?? 'متبرع كريم',
        amount:      String(d.amount),
        projectName: this.getProject(d),
        date:        d.created_at,
        reference:   d.reference,
      });
    } finally {
      this.generating.set(null);
    }
  }

  canRequestRefund(d: DonationHistoryItem): boolean {
    return d.status === 'completed' && !d.refund;
  }

  openRefundForm(id: number): void {
    this.refundFormOpenId.set(id);
    this.refundReason.set('');
    this.refundError.set(null);
  }

  closeRefundForm(): void {
    this.refundFormOpenId.set(null);
  }

  submitRefundRequest(d: DonationHistoryItem): void {
    const reason = this.refundReason().trim();
    if (!reason) {
      this.refundError.set(this.isRtl() ? 'اكتب سبب طلب الاسترداد' : 'Please describe why you want a refund');
      return;
    }

    this.refundSubmitting.set(true);
    this.refundError.set(null);
    this.donationService.requestRefund(d.id, reason).subscribe({
      next: () => {
        this.refundSubmitting.set(false);
        this.refundFormOpenId.set(null);
        this.loadPage(this.currentPage());
      },
      error: (err) => {
        this.refundSubmitting.set(false);
        this.refundError.set(err.error?.message ?? (this.isRtl() ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again'));
      },
    });
  }

  // تصدير حقيقي لكل التبرعات المعروضة حالياً (بعد الفلترة/البحث) كملف CSV —
  // بيفتح مباشرة بـExcel، ويشمل كل الحقول المهمة لمراجعة سجل تبرعاتك بالكامل
  exportCsv(): void {
    const rows = this.donations();
    const headers = ['المرجع', 'التاريخ', 'المشروع/الحملة', 'المبلغ', 'العملة', 'طريقة الدفع', 'الحالة'];
    const lines = [headers.join(',')];

    for (const d of rows) {
      lines.push([
        d.reference,
        d.created_at,
        `"${this.getProject(d).replace(/"/g, '""')}"`,
        d.amount,
        d.currency,
        this.methodLabel(d),
        d.status,
      ].join(','));
    }

    const csvContent = '﻿' + lines.join('\n'); // BOM حتى Excel يعرض العربي صح
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bunian-donations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
