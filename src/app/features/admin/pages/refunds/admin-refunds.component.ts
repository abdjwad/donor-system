import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';

interface Refund {
  id: number; donor: string; donorAr: string;
  amount: number; reason: string; reasonAr: string;
  status: 'pending'|'approved'|'rejected'; date: string;
}

const MOCK: Refund[] = [
  { id:1, donor:'Lina Ramadan', donorAr:'لينا رمضان', amount:25,  reason:'Duplicate payment',       reasonAr:'دفع مكرر',              status:'pending',  date:'2025-05-07' },
  { id:2, donor:'Omar Khalil',  donorAr:'عمر خليل',   amount:200, reason:'Project cancelled',       reasonAr:'المشروع ألغي',           status:'pending',  date:'2025-05-06' },
  { id:3, donor:'Hana Saleh',   donorAr:'هناء صالح',  amount:50,  reason:'Wrong project selected',  reasonAr:'اختيار مشروع خاطئ',     status:'approved', date:'2025-05-05' },
  { id:4, donor:'Bilal Qasim',  donorAr:'بلال قاسم',  amount:100, reason:'Technical error',         reasonAr:'خطأ تقني',               status:'rejected', date:'2025-05-04' },
];

@Component({
  selector: 'app-admin-refunds',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './admin-refunds.component.html',
  styleUrl:    './admin-refunds.component.scss',
})
export class AdminRefundsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly refunds = signal(MOCK);

  donorName(r: Refund): string  { return this.isRtl() ? r.donorAr : r.donor;   }
  reasonText(r: Refund): string { return this.isRtl() ? r.reasonAr : r.reason; }

  approve(id: number): void { this.refunds.update(list => list.map(r => r.id === id ? { ...r, status: 'approved' as const } : r)); }
  reject(id: number): void  { this.refunds.update(list => list.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r)); }
}
