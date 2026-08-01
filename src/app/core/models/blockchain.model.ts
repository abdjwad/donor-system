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
