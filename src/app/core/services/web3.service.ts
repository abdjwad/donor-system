import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import type { BlockchainDonation, ContractAddresses, WalletError } from '../models/blockchain.model';
import { environment } from '../../../environments/environment';

// ── ABI — فقط الدوال التي نستخدمها ─────────────────────────────
// ABI = Application Binary Interface: يصف للـ ethers.js كيف يتحدث مع العقد
const DONATION_ABI = [
  'function donate(uint256 projectId, string calldata message) external payable',
  'function totalRaised() external view returns (uint256)',
  'function totalRaisedByProject(uint256) external view returns (uint256)',
  'function getDonationsCount() external view returns (uint256)',
  'function getRecentDonations(uint256 count) external view returns (tuple(address donor, uint256 amount, uint256 projectId, uint256 timestamp, string message)[])',
  'function getContractBalance() external view returns (uint256)',
  'event DonationReceived(address indexed donor, uint256 indexed projectId, uint256 amount, uint256 donationId, uint256 timestamp, string message)',
];

// Chain IDs
const GANACHE_CHAIN_ID  = 1337;
const POLYGON_CHAIN_ID  = 137;
const AMOY_CHAIN_ID     = 80002;

@Injectable({ providedIn: 'root' })
export class Web3Service {
  private readonly platformId = inject(PLATFORM_ID);

  // ── الحالة التفاعلية ─────────────────────────────────────────
  readonly walletAddress  = signal<string | null>(null);
  readonly chainId        = signal<number | null>(null);
  readonly isConnected    = computed(() => !!this.walletAddress());
  readonly isWrongNetwork = computed(() => {
    const id = this.chainId();
    return id !== null && id !== GANACHE_CHAIN_ID && id !== POLYGON_CHAIN_ID && id !== AMOY_CHAIN_ID;
  });

  // عناوين العقود المنشورة (تُحمَّل من الملف المُولَّد بعد النشر)
  private addresses: ContractAddresses | null = null;

  // ─────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────

  /** تحميل عناوين العقود */
  async loadAddresses(): Promise<void> {
    if (this.addresses) return;
    try {
      const res = await fetch('/assets/blockchain/contract-addresses.json');
      this.addresses = await res.json();
    } catch {
      console.warn('Web3Service: لم يتم العثور على عناوين العقود');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // WALLET
  // ─────────────────────────────────────────────────────────────

  /** ربط MetaMask */
  async connectWallet(): Promise<void> {
    this.assertBrowser();
    const eth = this.getEthereum();

    const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
    if (accounts[0]) {
      this.walletAddress.set(accounts[0]);
      const hex: string = await eth.request({ method: 'eth_chainId' });
      this.chainId.set(parseInt(hex, 16));

      // الاستماع لتغيير الحساب أو الشبكة
      eth.on('accountsChanged', (accs: string[]) => {
        this.walletAddress.set(accs[0] ?? null);
      });
      eth.on('chainChanged', (hexId: string) => {
        this.chainId.set(parseInt(hexId, 16));
      });
    }
  }

  /** فصل المحفظة */
  disconnectWallet(): void {
    this.walletAddress.set(null);
    this.chainId.set(null);
  }

  /** طلب التبديل لشبكة Ganache المحلية */
  async switchToGanache(): Promise<void> {
    const eth = this.getEthereum();
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 0x539 = 1337
      });
    } catch (err: any) {
      // الشبكة غير موجودة في MetaMask — أضفها
      if (err.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         '0x539',
            chainName:       'Ganache',
            nativeCurrency:  { name: 'ETH', symbol: 'ETH', decimals: 18 },
            // محلياً = 127.0.0.1، وعالسيرفر البعيد = IP العام حتى محفظة أي
            // زائر (مو بس السيرفر نفسه) تقدر توصل للـ RPC — راجع environment.*.ts
            rpcUrls:         [environment.ganacheRpcUrl],
          }],
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // WRITE — يُرسل معاملة (يفتح MetaMask)
  // ─────────────────────────────────────────────────────────────

  /**
   * إرسال تبرع للعقد الذكي
   * @returns TX Hash — رقم المعاملة على الـ blockchain
   */
  async donate(projectId: number, amountEth: string, message: string): Promise<string> {
    await this.loadAddresses();
    const contract = await this.getSignerContract();

    const tx = await contract['donate'](projectId, message, {
      value: parseEther(amountEth),
    });
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  // ─────────────────────────────────────────────────────────────
  // READ — قراءة فقط (لا تفتح MetaMask، لا تكلف gas)
  // ─────────────────────────────────────────────────────────────

  /** إجمالي ما جُمع بالـ ETH */
  async getTotalRaised(): Promise<string> {
    const contract = await this.getReadContract();
    const wei = await contract['totalRaised']();
    return formatEther(wei);
  }

  /** ما جُمع لمشروع معين */
  async getProjectTotal(projectId: number): Promise<string> {
    const contract = await this.getReadContract();
    const wei = await contract['totalRaisedByProject'](projectId);
    return formatEther(wei);
  }

  /** عدد التبرعات الكلي */
  async getDonationsCount(): Promise<number> {
    const contract = await this.getReadContract();
    return Number(await contract['getDonationsCount']());
  }

  /** آخر N تبرعات */
  async getRecentDonations(count: number): Promise<BlockchainDonation[]> {
    const contract = await this.getReadContract();
    const raw = await contract['getRecentDonations'](count);
    return raw.map((d: any) => ({
      donor:     d.donor,
      amount:    formatEther(d.amount),
      projectId: Number(d.projectId),
      timestamp: Number(d.timestamp),
      message:   d.message,
    }));
  }

  /** رصيد المحفظة المتصلة بالـ ETH */
  async getWalletBalance(): Promise<string> {
    const addr = this.walletAddress();
    if (!addr) return '0';
    const provider = await this.getProvider();
    const wei = await provider.getBalance(addr);
    return parseFloat(formatEther(wei)).toFixed(4);
  }

  /** عنوان عقد BunianDonation */
  async getDonationContractAddress(): Promise<string> {
    await this.loadAddresses();
    return this.addresses?.BunianDonation.address ?? '';
  }

  /** اسم الشبكة المتصلة حالياً بصيغة يفهمها الباك اند (ganache/amoy/polygon) */
  networkName(): 'ganache' | 'amoy' | 'polygon' | null {
    switch (this.chainId()) {
      case GANACHE_CHAIN_ID: return 'ganache';
      case AMOY_CHAIN_ID:    return 'amoy';
      case POLYGON_CHAIN_ID: return 'polygon';
      default:               return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private assertBrowser(): void {
    if (!isPlatformBrowser(this.platformId)) throw new Error('Web3: browser only');
  }

  private getEthereum(): any {
    const eth = (window as any).ethereum;
    if (!eth) throw Object.assign(new Error('MetaMask غير مثبّت'), { code: 'NO_METAMASK' });
    return eth;
  }

  private async getProvider(): Promise<BrowserProvider> {
    return new BrowserProvider(this.getEthereum());
  }

  /** عقد للقراءة فقط — يستخدم RPC مباشرة بدون MetaMask */
  private async getReadContract(): Promise<Contract> {
    await this.loadAddresses();
    const addr = this.addresses?.BunianDonation.address;
    if (!addr) throw new Error('Web3: عناوين العقود غير محملة');
    const provider = await this.getProvider();
    return new Contract(addr, DONATION_ABI, provider);
  }

  /** عقد للكتابة — يحتاج توقيع المستخدم */
  private async getSignerContract(): Promise<Contract> {
    const provider = await this.getProvider();
    const signer   = await provider.getSigner();
    const addr     = this.addresses?.BunianDonation.address;
    if (!addr) throw new Error('Web3: عناوين العقود غير محملة');
    return new Contract(addr, DONATION_ABI, signer);
  }

  /** ترجمة أخطاء ethers.js لأخطاء واضحة */
  parseError(err: any): WalletError {
    if (err.code === 'NO_METAMASK')        return 'NO_METAMASK';
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') return 'USER_REJECTED';
    if (err.code === 'INSUFFICIENT_FUNDS') return 'INSUFFICIENT_FUNDS';
    if (err.message?.includes('rejected')) return 'TX_REJECTED';
    return 'UNKNOWN';
  }
}
