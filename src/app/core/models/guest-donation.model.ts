export type DonationType = 'one_time' | 'recurring';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank';
export type Currency = 'USD' | 'EUR';

export interface GuestDonation {
  name?: string;
  email: string;
  phone?: string;
  amount: number;
  currency: Currency;
  project_id?: number;
  donation_type: DonationType;
  payment_method: PaymentMethod;
  payment_token?: string;
  is_anonymous: boolean;
  dedication_message?: string;
}

export interface GuestDonationResponse {
  id: number;
  reference: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'completed' | 'failed';
  message: string;
}
