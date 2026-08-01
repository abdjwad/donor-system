import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-donation-history',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, MatSelectModule,
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

  readonly isRtl       = computed(() => this.langService.currentLang() === 'ar');
  readonly loading      = signal(true);
  readonly allDonations = signal<any[]>([]);
  readonly filterStatus = signal<string>('all');

  readonly donations = computed(() => {
    const s    = this.filterStatus();
    const list = this.allDonations();
    return s === 'all' ? list : list.filter(d => d.status === s);
  });

  ngOnInit(): void {
    this.donationService.getHistory().subscribe({
      next: (res) => { this.allDonations.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getProject(d: any): string {
    const source = d.project ?? d.campaign;
    return this.isRtl()
      ? (source?.title_ar ?? 'الصندوق العام')
      : (source?.title_en ?? 'General Fund');
  }

  methodLabel(d: any): string {
    const labelsAr: Record<string, string> = {
      wallet: 'من المحفظة', bank: 'تحويل بنكي', stripe: 'بطاقة ائتمان', paypal: 'PayPal', crypto: 'عملة رقمية',
    };
    const labelsEn: Record<string, string> = {
      wallet: 'Wallet', bank: 'Bank Transfer', stripe: 'Card', paypal: 'PayPal', crypto: 'Crypto',
    };
    const key = d.payment_method ?? d.method;
    return this.isRtl() ? (labelsAr[key] ?? key) : (labelsEn[key] ?? key);
  }

  async downloadCertificate(d: any): Promise<void> {
    this.generating.set(d.id);
    try {
      await this.certService.download({
        donorName:   this.authService.currentUser()?.name ?? 'متبرع كريم',
        amount:      String(d.amount),
        projectName: this.getProject(d),
        date:        d.date ?? new Date().toLocaleDateString('ar-SY'),
        reference:   d.reference ?? d.id,
      });
    } finally {
      this.generating.set(null);
    }
  }
}
