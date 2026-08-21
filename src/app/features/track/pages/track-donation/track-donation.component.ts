import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LanguageService } from '../../../../core/services/language.service';
import { DonationService } from '../../../donate/services/donation.service';
import { RepairProjectsApiService } from '../../../../core/services/repair-projects-api.service';
import { CertificateService } from '../../../../shared/services/certificate.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DonationHistoryItem } from '../../../../core/models/guest-donation.model';
import { ProjectProgress } from '../../../../core/models/repair-project.model';

@Component({
  selector: 'app-track-donation',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DecimalPipe, SlicePipe, TranslateModule,
    MatButtonModule, MatProgressSpinnerModule, NavbarComponent, SiteFooterComponent,
  ],
  templateUrl: './track-donation.component.html',
  styleUrl: './track-donation.component.scss',
})
export class TrackDonationComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly langService    = inject(LanguageService);
  private readonly donationApi    = inject(DonationService);
  private readonly repairApi      = inject(RepairProjectsApiService);
  private readonly certService    = inject(CertificateService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly refInput   = signal('');
  readonly loading     = signal(false);
  readonly searched     = signal(false);
  readonly notFound    = signal(false);
  readonly donation    = signal<DonationHistoryItem | null>(null);
  readonly generating  = signal(false);

  readonly progress        = signal<ProjectProgress | null>(null);
  readonly progressLoading = signal(false);

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) {
      this.refInput.set(ref);
      this.search();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.search();
  }

  search(): void {
    const ref = this.refInput().trim();
    if (!ref) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.searched.set(true);
    this.donation.set(null);
    this.progress.set(null);

    this.donationApi.getDonationByRef(ref).subscribe({
      next: (d) => {
        this.donation.set(d);
        this.loading.set(false);
        if (d.project) {
          this.loadProgress(d.project.id);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  private loadProgress(projectId: number): void {
    this.progressLoading.set(true);
    this.repairApi.getProjectProgress(projectId).subscribe({
      next: (p) => { this.progress.set(p); this.progressLoading.set(false); },
      error: () => this.progressLoading.set(false),
    });
  }

  getProjectTitle(d: DonationHistoryItem): string {
    const source = d.project ?? d.campaign;
    return this.isRtl() ? (source?.title_ar ?? 'الصندوق العام') : (source?.title_en ?? 'General Fund');
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
    return null;
  }

  fundingPct(): number {
    const p = this.donation()?.project;
    return p ? Math.min(100, Math.max(0, p.funding_progress)) : 0;
  }

  async downloadCertificate(): Promise<void> {
    const d = this.donation();
    if (!d || d.status !== 'completed') return;
    this.generating.set(true);
    try {
      await this.certService.download({
        donorName:   'متبرع كريم',
        amount:      String(d.amount),
        projectName: this.getProjectTitle(d),
        date:        d.created_at,
        reference:   d.reference,
      });
    } finally {
      this.generating.set(false);
    }
  }
}
