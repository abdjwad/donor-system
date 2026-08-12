import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, AdminDonation, PageMeta, Wallet } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-donations',
  standalone: true,
  imports: [TranslateModule, FormsModule, MatSelectModule, MatButtonModule],
  templateUrl: './admin-donations.component.html',
  styleUrl:    './admin-donations.component.scss',
})
export class AdminDonationsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  donations    = signal<AdminDonation[]>([]);
  meta         = signal<PageMeta>({ total: 0, current_page: 1, last_page: 1 });
  loading      = signal(true);
  filterStatus = signal('all');

  // Refund modal
  showRefundModal  = signal(false);
  refundTargetId   = signal<number | null>(null);
  refundReason     = signal('');
  refundSubmitting = signal(false);

  // Reject (bank transfer) modal
  showRejectModal  = signal(false);
  rejectTargetId   = signal<number | null>(null);
  rejectReason     = signal('');
  rejectSubmitting = signal(false);
  confirmingId     = signal<number | null>(null);

  // إعادة تعيين الحساب البنكي المرتبط بتبرع بنكي
  wallets           = signal<Wallet[]>([]);
  reassigningId     = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
    this.adminApi.getWallets().subscribe({ next: (w) => this.wallets.set(w), error: () => {} });
  }

  load(): void {
    this.loading.set(true);
    this.adminApi.getDonations({ status: this.filterStatus(), page: this.meta().current_page }).subscribe({
      next: (res) => { this.donations.set(res.data); this.meta.set(res.meta); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeWallet(donationId: number, walletId: string): void {
    const id = Number(walletId);
    if (!id) return;
    this.reassigningId.set(donationId);
    this.adminApi.reassignDonationWallet(donationId, id).subscribe({
      next: () => { this.reassigningId.set(null); this.load(); },
      error: () => this.reassigningId.set(null),
    });
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
    this.meta.update(m => ({ ...m, current_page: 1 }));
    this.load();
  }

  openRefund(id: number): void {
    this.refundTargetId.set(id);
    this.refundReason.set('');
    this.showRefundModal.set(true);
  }

  confirmRefund(): void {
    const id = this.refundTargetId();
    const reason = this.refundReason().trim();
    if (!id || !reason) return;
    this.refundSubmitting.set(true);
    this.adminApi.refundDonation(id, reason).subscribe({
      next: () => { this.showRefundModal.set(false); this.refundSubmitting.set(false); this.load(); },
      error: () => this.refundSubmitting.set(false),
    });
  }

  confirmDonation(id: number): void {
    this.confirmingId.set(id);
    this.adminApi.confirmDonation(id).subscribe({
      next: () => { this.confirmingId.set(null); this.load(); },
      error: () => this.confirmingId.set(null),
    });
  }

  openReject(id: number): void {
    this.rejectTargetId.set(id);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const id = this.rejectTargetId();
    const reason = this.rejectReason().trim();
    if (!id || !reason) return;
    this.rejectSubmitting.set(true);
    this.adminApi.rejectDonation(id, reason).subscribe({
      next: () => { this.showRejectModal.set(false); this.rejectSubmitting.set(false); this.load(); },
      error: () => this.rejectSubmitting.set(false),
    });
  }

  donorName(d: AdminDonation): string   { return d.name; }
  projectName(d: AdminDonation): string { return this.isRtl() ? d.project_ar : d.project_en; }
}
