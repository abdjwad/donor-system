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
