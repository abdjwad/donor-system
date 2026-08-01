import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService }  from '../../../../core/services/language.service';
import { AdminApiService, AdminCampaign } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-campaigns',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './admin-campaigns.component.html',
  styleUrl:    './admin-campaigns.component.scss',
})
export class AdminCampaignsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);
  private readonly fb          = inject(FormBuilder);

  readonly isRtl    = computed(() => this.langService.currentLang() === 'ar');
  readonly campaigns = signal<AdminCampaign[]>([]);
  readonly loading   = signal(true);
  readonly showForm  = signal(false);
  readonly saving    = signal(false);

  readonly createForm = this.fb.group({
    title_ar:       ['', Validators.required],
    title_en:       ['', Validators.required],
    description_ar: [''],
    description_en: [''],
    category:       ['housing', Validators.required],
    funding_goal:   [null as number | null, [Validators.required, Validators.min(1)]],
    ends_at:        [''],
    is_urgent:      [false],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminApi.getCampaigns().subscribe({
      next: (res) => { this.campaigns.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggle(id: number, currentStatus: string): void {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    this.adminApi.updateCampaign(id, { status: newStatus }).subscribe({ next: () => this.load() });
  }

  deleteCampaign(id: number): void {
    if (!confirm(this.isRtl() ? 'حذف الحملة نهائياً؟' : 'Delete this campaign?')) return;
    this.adminApi.deleteCampaign(id).subscribe({ next: () => this.load() });
  }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.adminApi.createCampaign(this.createForm.value as Record<string, any>).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.createForm.reset({ category: 'housing', is_urgent: false }); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  title(c: AdminCampaign): string { return this.isRtl() ? c.title_ar : c.title_en; }
  pct(c: AdminCampaign): number   { return c.progress_pct ?? Math.min(100, Math.round((c.amount_raised / (c.funding_goal || 1)) * 100)); }
  fmt(n: number): string          { return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'K' : '$' + n; }
}
