import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, AdminWalletTopup, PageMeta, Wallet } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-wallet-topups',
  standalone: true,
  imports: [TranslateModule, FormsModule, MatSelectModule, MatButtonModule],
  templateUrl: './admin-wallet-topups.component.html',
  styleUrl:    './admin-wallet-topups.component.scss',
})
export class AdminWalletTopupsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  topups       = signal<AdminWalletTopup[]>([]);
  meta         = signal<PageMeta>({ total: 0, current_page: 1, last_page: 1 });
  loading      = signal(true);
  filterStatus = signal('pending');

  confirmingId = signal<number | null>(null);

  // Reject modal
  showRejectModal  = signal(false);
  rejectTargetId   = signal<number | null>(null);
  rejectReason     = signal('');
  rejectSubmitting = signal(false);

  wallets       = signal<Wallet[]>([]);
  reassigningId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
    this.adminApi.getWallets().subscribe({ next: (w) => this.wallets.set(w), error: () => {} });
  }

  load(): void {
    this.loading.set(true);
    this.adminApi.getWalletTopups({ status: this.filterStatus(), page: this.meta().current_page }).subscribe({
      next: (res) => { this.topups.set(res.data); this.meta.set(res.meta); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeWallet(topupId: number, walletId: string): void {
    const id = Number(walletId);
    if (!id) return;
    this.reassigningId.set(topupId);
    this.adminApi.reassignWalletTopupWallet(topupId, id).subscribe({
      next: () => { this.reassigningId.set(null); this.load(); },
      error: () => this.reassigningId.set(null),
    });
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
    this.meta.update(m => ({ ...m, current_page: 1 }));
    this.load();
  }

  confirmTopup(id: number): void {
    this.confirmingId.set(id);
    this.adminApi.confirmWalletTopup(id).subscribe({
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
    this.adminApi.rejectWalletTopup(id, reason).subscribe({
      next: () => { this.showRejectModal.set(false); this.rejectSubmitting.set(false); this.load(); },
      error: () => this.rejectSubmitting.set(false),
    });
  }
}
