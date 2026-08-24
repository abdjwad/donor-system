import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { parseEther } from 'ethers';
import { Web3Service } from '../../../../core/services/web3.service';
import { LanguageService } from '../../../../core/services/language.service';
import { DonationService } from '../../services/donation.service';
import { copyToClipboard } from '../../../../core/utils/clipboard.util';

type TxState = 'idle' | 'pending' | 'success' | 'error';
type SyncState = 'idle' | 'syncing' | 'synced' | 'sync-failed';

@Component({
  selector: 'app-crypto-payment',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, RouterLink, SlicePipe],
  templateUrl: './crypto-payment.component.html',
  styleUrl:    './crypto-payment.component.scss',
})
export class CryptoPaymentComponent implements OnInit {
  @Input() projectId = 0;

  readonly web3    = inject(Web3Service);
  readonly langSvc = inject(LanguageService);
  readonly donSvc  = inject(DonationService);
  readonly isRtl   = computed(() => this.langSvc.currentLang() === 'ar');

  txState    = signal<TxState>('idle');
  txHash     = signal<string | null>(null);
  txError    = signal<string | null>(null);
  balance    = signal<string>('—');
  contractAddr = signal<string>('');
  syncState  = signal<SyncState>('idle');

  get amount(): string {
    return String(this.donSvc.donationState().amount ?? 1);
  }

  get message(): string {
    return this.donSvc.donationState().dedication_message ?? '';
  }

  async ngOnInit(): Promise<void> {
    if (this.web3.isConnected()) {
      this.balance.set(await this.web3.getWalletBalance());
    }
    this.contractAddr.set(await this.web3.getDonationContractAddress());
  }

  async connect(): Promise<void> {
    try {
      await this.web3.connectWallet();
      this.balance.set(await this.web3.getWalletBalance());
    } catch (err: any) {
      const code = this.web3.parseError(err);
      if (code === 'NO_METAMASK') window.open('https://metamask.io/download/', '_blank');
    }
  }

  async sendDonation(): Promise<void> {
    if (!this.web3.isConnected()) return;
    this.txState.set('pending');
    this.txError.set(null);

    try {
      const hash = await this.web3.donate(this.projectId, this.amount, this.message);
      this.txHash.set(hash);
      this.txState.set('success');
      this.balance.set(await this.web3.getWalletBalance());
      this.syncOfficialLedger(hash);
    } catch (err: any) {
      const code = this.web3.parseError(err);
      this.txError.set(this.errorMessage(code));
      this.txState.set('error');
    }
  }

  /**
   * التبرع نفسه نجح ومؤكَّد على البلوكتشين أصلاً بهاي المرحلة — هاي الخطوة
   * فقط تسجّله بسجل بنيان الرسمي (collected_amount + السجل المالي الإداري).
   * فشلها لا يعني فشل التبرع نفسه، فما منرجع لحالة error.
   */
  private syncOfficialLedger(txHash: string): void {
    const network = this.web3.networkName();
    if (!network) { this.syncState.set('sync-failed'); return; }

    const state = this.donSvc.donationState();
    this.syncState.set('syncing');

    this.donSvc.confirmCrypto({
      tx_hash:            txHash,
      contract_address:   this.contractAddr(),
      from_address:        this.web3.walletAddress() ?? '',
      network,
      amount:              Number(this.amount),
      amount_wei:          parseEther(this.amount).toString(),
      project_id:          this.projectId || undefined,
      campaign_id:         state.campaign_id,
      donation_type:       state.donation_type ?? 'one_time',
      is_anonymous:        state.is_anonymous ?? false,
      dedication_message:  this.message || undefined,
      name:                state.name,
      email:               state.email ?? '',
      phone:               state.phone,
    }).subscribe({
      next: () => this.syncState.set('synced'),
      error: () => this.syncState.set('sync-failed'),
    });
  }

  get explorerUrl(): string {
    const hash = this.txHash();
    if (!hash) return '';
    // Ganache local — لا يوجد مستكشف عام؛ الشبكات العامة (Amoy/Polygon) فقط عندها رابط فعلي
    const network = this.web3.networkName();
    if (network === 'amoy')    return `https://amoy.polygonscan.com/tx/${hash}`;
    if (network === 'polygon') return `https://polygonscan.com/tx/${hash}`;
    return '';
  }

  copyHash(): void {
    const hash = this.txHash();
    if (hash) copyToClipboard(hash);
  }

  private errorMessage(code: string): string {
    const ar = this.isRtl();
    const map: Record<string, string> = {
      USER_REJECTED:      ar ? 'تم إلغاء العملية'       : 'Transaction cancelled',
      WRONG_NETWORK:      ar ? 'يرجى تبديل الشبكة'      : 'Please switch network',
      INSUFFICIENT_FUNDS: ar ? 'رصيد غير كافٍ'           : 'Insufficient balance',
      TX_REJECTED:        ar ? 'رُفضت المعاملة'           : 'Transaction rejected',
      UNKNOWN:            ar ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred',
    };
    return map[code] ?? map['UNKNOWN'];
  }
}
