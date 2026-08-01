import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { Web3Service } from '../../../../core/services/web3.service';
import { LanguageService } from '../../../../core/services/language.service';
import { DonationService } from '../../services/donation.service';

type TxState = 'idle' | 'pending' | 'success' | 'error';

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
    } catch (err: any) {
      const code = this.web3.parseError(err);
      this.txError.set(this.errorMessage(code));
      this.txState.set('error');
    }
  }

  get explorerUrl(): string {
    const hash = this.txHash();
    if (!hash) return '';
    // Ganache local — لا يوجد explorer
    return `http://127.0.0.1:8545/tx/${hash}`;
  }

  copyHash(): void {
    const hash = this.txHash();
    if (hash) navigator.clipboard.writeText(hash);
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
