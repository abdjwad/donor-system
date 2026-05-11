import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';

interface Donation {
  id: number; donor: string; donorAr: string;
  amount: number; project: string; projectAr: string;
  method: string; status: 'completed'|'pending'|'refunded'|'failed'; date: string;
}

const MOCK: Donation[] = [
  { id:1,  donor:'Ahmad Al-Ali',   donorAr:'أحمد العلي',    amount:150, project:'Homes Aleppo',   projectAr:'منازل حلب',     method:'Stripe', status:'completed', date:'2025-05-10' },
  { id:2,  donor:'Sara Hassan',    donorAr:'سارة حسن',      amount:50,  project:'Hope School',    projectAr:'مدرسة الأمل',   method:'PayPal', status:'completed', date:'2025-05-10' },
  { id:3,  donor:'Omar Khalil',    donorAr:'عمر خليل',      amount:200, project:'General Fund',   projectAr:'الصندوق العام', method:'Stripe', status:'pending',   date:'2025-05-09' },
  { id:4,  donor:'Nour Ibrahim',   donorAr:'نور إبراهيم',   amount:75,  project:'Medical Idlib',  projectAr:'مركز إدلب',    method:'Bank',   status:'completed', date:'2025-05-09' },
  { id:5,  donor:'Khaled Mustafa', donorAr:'خالد مصطفى',   amount:500, project:'Water Project',  projectAr:'مشروع مياه',   method:'Stripe', status:'completed', date:'2025-05-08' },
  { id:6,  donor:'Lina Ramadan',   donorAr:'لينا رمضان',   amount:25,  project:'General Fund',   projectAr:'الصندوق العام', method:'PayPal', status:'refunded',  date:'2025-05-07' },
  { id:7,  donor:'Tariq Nasser',   donorAr:'طارق ناصر',    amount:100, project:'Homes Daraa',    projectAr:'منازل درعا',    method:'Stripe', status:'failed',    date:'2025-05-06' },
  { id:8,  donor:'Rima Aziz',      donorAr:'ريم عزيز',     amount:300, project:'School Damascus', projectAr:'مدرسة دمشق',   method:'Stripe', status:'completed', date:'2025-05-05' },
];

@Component({
  selector: 'app-admin-donations',
  standalone: true,
  imports: [TranslateModule, FormsModule, MatSelectModule, MatButtonModule],
  templateUrl: './admin-donations.component.html',
  styleUrl:    './admin-donations.component.scss',
})
export class AdminDonationsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  filterStatus = signal<string>('all');
  readonly donations = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? MOCK : MOCK.filter(d => d.status === s);
  });

  donorName(d: Donation): string   { return this.isRtl() ? d.donorAr   : d.donor;   }
  projectName(d: Donation): string { return this.isRtl() ? d.projectAr : d.project; }
}
