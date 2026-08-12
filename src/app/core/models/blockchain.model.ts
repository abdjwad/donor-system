// أنواع بيانات الـ Blockchain لمنصة بنيان

export interface BlockchainDonation {
  donor:     string;   // عنوان المحفظة: 0x...
  amount:    string;   // المبلغ بـ ETH (مُحوَّل من wei)
  projectId: number;
  timestamp: number;   // Unix timestamp
  message:   string;
}

export interface ContractAddresses {
  BunianDonation: { address: string; explorerUrl: string };
  BunianProject:  { address: string; explorerUrl: string };
}

export type WalletError =
  | 'NO_METAMASK'       // MetaMask غير مثبّت
  | 'USER_REJECTED'     // المستخدم رفض الاتصال
  | 'WRONG_NETWORK'     // شبكة خاطئة
  | 'INSUFFICIENT_FUNDS'// رصيد غير كافٍ
  | 'TX_REJECTED'       // المستخدم رفض المعاملة
  | 'UNKNOWN';          // خطأ غير متوقع

export type BlockchainNetwork = 'ganache' | 'amoy' | 'polygon';

/** حمولة تسجيل تبرع نُفّذ فعلياً على البلوكتشين بالسجل الرسمي — POST /donate/crypto-confirm */
export interface CryptoConfirmPayload {
  tx_hash: string;
  contract_address: string;
  from_address: string;
  network: BlockchainNetwork;
  amount: number;      // بالـ ETH
  amount_wei: string;  // القيمة الدقيقة بالـ wei كنص (BigInt)
  project_id?: number;
  campaign_id?: number;
  donation_type?: 'one_time' | 'recurring';
  is_anonymous?: boolean;
  dedication_message?: string;
  name?: string;
  email: string;
  phone?: string;
}

export interface CryptoConfirmResponse {
  reference: string;
  amount: number;
  status: string;
}
