import { PaymentMethod } from './guest-donation.model';

export interface DonorWalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTopup {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  bankTransferReference: string | null;
  receiptSubmittedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface WalletTopupResponse {
  reference: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  wallet?: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    iban: string;
    currency: string;
  } | null;
  message: string;
}

export interface DonateFromWalletPayload {
  amount: number;
  project_id?: number;
  campaign_id?: number;
  donation_type: 'one_time' | 'recurring';
  is_anonymous: boolean;
  dedication_message?: string;
}

export interface DonateFromWalletResponse {
  reference: string;
  amount: number;
  status: string;
}
