import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

const RECENT = [
  { donor: 'Ahmad Al-Ali',    donorAr: 'أحمد العلي',      amount: 150, project: 'Homes Aleppo',   projectAr: 'منازل حلب',     method: 'Stripe', status: 'completed', date: '2025-05-10' },
  { donor: 'Sara Hassan',     donorAr: 'سارة حسن',        amount: 50,  project: 'Hope School',    projectAr: 'مدرسة الأمل',   method: 'PayPal', status: 'completed', date: '2025-05-10' },
  { donor: 'Omar Khalil',     donorAr: 'عمر خليل',        amount: 200, project: 'General Fund',   projectAr: 'الصندوق العام', method: 'Stripe', status: 'pending',   date: '2025-05-09' },
  { donor: 'Nour Ibrahim',    donorAr: 'نور إبراهيم',     amount: 75,  project: 'Medical Idlib',  projectAr: 'مركز إدلب',    method: 'Bank',   status: 'completed', date: '2025-05-09' },
  { donor: 'Khaled Mustafa',  donorAr: 'خالد مصطفى',     amount: 500, project: 'Water Project',  projectAr: 'مشروع مياه',   method: 'Stripe', status: 'completed', date: '2025-05-08' },
];

const CATEGORIES = [
  { labelAr: 'إسكان',       labelEn: 'Housing',        pct: 38, color: '#1B6B3A' },
  { labelAr: 'تعليم',       labelEn: 'Education',      pct: 22, color: '#C5952A' },
  { labelAr: 'صحة',         labelEn: 'Healthcare',     pct: 18, color: '#1A2D5A' },
  { labelAr: 'بنية تحتية', labelEn: 'Infrastructure', pct: 14, color: '#2E8B57' },
  { labelAr: 'مياه',        labelEn: 'Water',          pct: 8,  color: '#7A5810' },
];

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './admin-overview.component.html',
  styleUrl:    './admin-overview.component.scss',
})
export class AdminOverviewComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly recent = RECENT;
  readonly categories = CATEGORIES;

  stats = [
    { key: 'TOTAL_DONATIONS',  icon: 'paid',                value: '$2,847,500', change: '+12%' },
    { key: 'TOTAL_DONORS',     icon: 'group',               value: '12,847',     change: '+8%'  },
    { key: 'ACTIVE_PROJECTS',  icon: 'construction',        value: '48',         change: '+3'   },
    { key: 'PENDING_REFUNDS',  icon: 'pending_actions',     value: '7',          change: '-2'   },
  ];

  donorName(r: typeof RECENT[0]): string    { return this.isRtl() ? r.donorAr   : r.donor;   }
  projectName(r: typeof RECENT[0]): string  { return this.isRtl() ? r.projectAr : r.project; }
  catLabel(c: typeof CATEGORIES[0]): string { return this.isRtl() ? c.labelAr  : c.labelEn; }
}
