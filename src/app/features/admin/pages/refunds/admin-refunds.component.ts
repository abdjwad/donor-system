import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, AdminRefund } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-refunds',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './admin-refunds.component.html',
  styleUrl:    './admin-refunds.component.scss',
})
export class AdminRefundsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl  = computed(() => this.langService.currentLang() === 'ar');
  readonly refunds = signal<AdminRefund[]>([]);
  readonly loading = signal(true);
  readonly total   = signal(0);

  readonly showRejectModal = signal(false);
  readonly rejectTargetId  = signal<number | null>(null);
  readonly rejectReason    = signal('');
  readonly rejectSubmitting = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminApi.getRefunds().subscribe({
      next: (res) => { this.refunds.set(res.data); this.total.set(res.meta.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(id: number): void {
    this.adminApi.approveRefund(id).subscribe({ next: () => this.load() });
  }

  reject(id: number): void {
    this.rejectTargetId.set(id);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const id = this.rejectTargetId();
    const reason = this.rejectReason().trim();
    if (!id || !reason) return;
    this.rejectSubmitting.set(true);
    this.adminApi.rejectRefund(id, reason).subscribe({
      next: () => { this.showRejectModal.set(false); this.rejectSubmitting.set(false); this.load(); },
      error: () => this.rejectSubmitting.set(false),
    });
  }

  donorName(r: AdminRefund): string  { return r.donor_name; }
  reasonText(r: AdminRefund): string { return r.reason; }
}
