export type DonationType = 'one_time' | 'recurring';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank' | 'crypto' | 'wallet';
export type Currency = 'USD' | 'EUR';

export interface GuestDonation {
  name?: string;
  email: string;
  phone?: string;
  amount: number;
  currency: Currency;
  project_id?: number;
  campaign_id?: number;
  donation_type: DonationType;
  payment_method: PaymentMethod;
  payment_token?: string;
  is_anonymous: boolean;
  dedication_message?: string;
}

export interface WalletInfo {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban: string;
  currency: string;
}

export interface GuestDonationResponse {
  id: number;
  reference: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'completed' | 'failed';
  message: string;
  wallet?: WalletInfo | null;
  stripe_client_secret?: string | null;
  payment_method?: PaymentMethod;
  bank_transfer_reference?: string | null;
  receipt_submitted_at?: string | null;
  rejection_reason?: string | null;
  project?: { id: number; title_ar: string; title_en: string } | null;
}

export interface ConfirmBankTransferPayload {
  bank_transfer_reference: string;
  receipt: File;
}

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface DonationTimelineEvent {
  event: string;
  label_ar: string;
  at: string | null;
}

export interface DonationHistoryItem {
  id: number;
  reference: string;
  amount: number;
  currency: Currency;
  status: DonationStatus;
  payment_method: PaymentMethod;
  donation_type: DonationType;
  is_anonymous: boolean;
  dedication_message: string | null;
  project: {
    id: number; title_ar: string; title_en: string; status: string;
    funding_progress: number; collected_amount: number; total_estimated_cost: number;
  } | null;
  campaign: { id: number; title_ar: string; title_en: string } | null;
  redirected_from_project: boolean;
  blockchain: { tx_hash: string; network: string; contract_address: string } | null;
  bank: {
    account_name: string | null;
    transfer_reference: string | null;
    receipt_url: string | null;
    receipt_submitted_at: string | null;
  } | null;
  rejection_reason: string | null;
  refund: {
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    rejection_reason: string | null;
    requested_at: string | null;
    processed_at: string | null;
    processed_by: string | null;
  } | null;
  timeline: DonationTimelineEvent[];
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  created_at_iso: string;
  /** حساب المنصّة البنكي — يُرجَعه success() فقط لو التبرع بنكي وبانتظار إثبات تحويل */
  wallet?: WalletInfo | null;
}

export interface DonationHistoryPage {
  data: DonationHistoryItem[];
  total: number;
  current_page: number;
  last_page: number;
}

export interface DonorDashboardStats {
  total_donated: number;
  total_refunded: number;
  pending_count: number;
  donations_count: number;
  projects_supported: number;
  families_helped: number;
}
