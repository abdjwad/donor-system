import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { DashSidebarComponent } from '../../../../shared/components/dash-sidebar/dash-sidebar.component';

const ALL_DONATIONS = [
  { id: 1, date: '2025-05-01', projectAr: 'إعادة بناء منازل في حلب', projectEn: 'Homes in Aleppo',  amount: 50,  method: 'Stripe', status: 'completed', ref: 'TXN-00101' },
  { id: 2, date: '2025-04-15', projectAr: 'الصندوق العام',            projectEn: 'General Fund',    amount: 25,  method: 'PayPal', status: 'completed', ref: 'TXN-00098' },
  { id: 3, date: '2025-03-22', projectAr: 'مدرسة الأمل في حمص',      projectEn: 'Hope School Homs', amount: 100, method: 'Stripe', status: 'completed', ref: 'TXN-00087' },
  { id: 4, date: '2025-02-10', projectAr: 'مركز صحي في إدلب',        projectEn: 'Medical Center Idlib', amount: 75, method: 'Bank', status: 'completed', ref: 'TXN-00072' },
  { id: 5, date: '2025-01-20', projectAr: 'حملة رمضان',              projectEn: 'Ramadan Campaign', amount: 200, method: 'Stripe', status: 'refunded',  ref: 'TXN-00061' },
];

@Component({
  selector: 'app-donation-history',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatSelectModule, FormsModule,
            NavbarComponent, SiteFooterComponent, DashSidebarComponent],
  templateUrl: './donation-history.component.html',
  styleUrl: './donation-history.component.scss',
})
export class DonationHistoryComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  filterStatus = signal<string>('all');
  readonly donations = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? ALL_DONATIONS : ALL_DONATIONS.filter((d) => d.status === s);
  });

  getProject(d: typeof ALL_DONATIONS[0]): string { return this.isRtl() ? d.projectAr : d.projectEn; }
  downloadInvoice(d: typeof ALL_DONATIONS[0]): void { alert(this.isRtl() ? 'جاري تحميل الإيصال: ' + d.ref : 'Downloading receipt: ' + d.ref); }
}
