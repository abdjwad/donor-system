import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';

interface AdminCampaign {
  id: number; title: string; titleAr: string;
  raised: number; goal: number; donors: number;
  status: 'active'|'paused'|'ended'; endsAt: string;
}

const MOCK: AdminCampaign[] = [
  { id:1, title:'Ramadan Campaign', titleAr:'حملة رمضان',       raised:85000, goal:100000, donors:420, status:'active',  endsAt:'2025-05-30' },
  { id:2, title:'Aleppo Rebuild',   titleAr:'إعادة بناء حلب',  raised:230000,goal:300000, donors:980, status:'active',  endsAt:'2025-06-15' },
  { id:3, title:'Back to School',   titleAr:'العودة للمدرسة',  raised:45000, goal:60000,  donors:210, status:'paused',  endsAt:'2025-07-01' },
  { id:4, title:'Winter Relief',    titleAr:'مساعدات الشتاء',  raised:120000,goal:120000, donors:650, status:'ended',   endsAt:'2025-03-01' },
];

@Component({
  selector: 'app-admin-campaigns',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './admin-campaigns.component.html',
  styleUrl:    './admin-campaigns.component.scss',
})
export class AdminCampaignsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns = signal(MOCK);

  title(c: AdminCampaign): string { return this.isRtl() ? c.titleAr : c.title; }
  pct(c: AdminCampaign): number   { return Math.min(100, Math.round((c.raised / c.goal) * 100)); }
  fmt(n: number): string          { return n >= 1000 ? '$' + (n/1000).toFixed(0) + 'K' : '$' + n; }

  toggle(id: number): void {
    this.campaigns.update(list => list.map(c =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' as const : 'active' as const } : c
    ));
  }
}
