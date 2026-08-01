import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService, Wallet, WalletBreakdown } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-wallet-settings',
  standalone: true,
  imports: [FormsModule, MatButtonModule, DecimalPipe],
  templateUrl: './admin-wallet-settings.component.html',
  styleUrl: './admin-wallet-settings.component.scss',
})
export class AdminWalletSettingsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl    = computed(() => this.langService.currentLang() === 'ar');
  readonly wallets   = signal<Wallet[]>([]);
  readonly loading   = signal(true);
  readonly breakdown = signal<WalletBreakdown | null>(null);
  readonly breakdownLoading = signal(true);
  readonly saving    = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly showCreate = signal(false);

  form = this.emptyForm();

  private emptyForm() {
    return {
      name: '', bank_name: '', account_holder_name: '',
      account_number: '', iban: '', currency: 'USD', is_active: true, notes: '',
    };
  }

  ngOnInit(): void {
    this.load();
    this.loadBreakdown();
  }

  load(): void {
    this.loading.set(true);
    this.adminApi.getWallets().subscribe({
      next: (w) => { this.wallets.set(w); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadBreakdown(): void {
    this.breakdownLoading.set(true);
    this.adminApi.getWalletBreakdown().subscribe({
      next: (b) => { this.breakdown.set(b); this.breakdownLoading.set(false); },
      error: () => this.breakdownLoading.set(false),
    });
  }

  startEdit(wallet: Wallet): void {
    this.editingId.set(wallet.id);
    this.showCreate.set(false);
    this.form = {
      name: wallet.name, bank_name: wallet.bank_name, account_holder_name: wallet.account_holder_name,
      account_number: wallet.account_number, iban: wallet.iban, currency: wallet.currency,
      is_active: wallet.is_active, notes: wallet.notes ?? '',
    };
  }

  startCreate(): void {
    this.showCreate.set(true);
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.showCreate.set(false);
  }

  submit(): void {
    this.saving.set(true);
    const id = this.editingId();
    const obs = id ? this.adminApi.updateWallet(id, this.form) : this.adminApi.createWallet(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.cancelEdit(); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
