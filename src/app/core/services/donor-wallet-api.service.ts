import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/auth-response.models';
import { PaymentMethod, ConfirmBankTransferPayload } from '../models/guest-donation.model';
import {
  DonateFromWalletPayload,
  DonateFromWalletResponse,
  DonorWalletBalance,
  WalletTopup,
  WalletTopupResponse,
} from '../models/donor-wallet.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonorWalletApiService {
  private readonly http = inject(HttpClient);
  private readonly API  = `${environment.apiUrl}/v1`;

  getBalance(): Observable<DonorWalletBalance> {
    return this.http
      .get<ApiResponse<DonorWalletBalance>>(`${this.API}/wallet`)
      .pipe(map((res) => res.data));
  }

  createTopup(amount: number, payment_method: PaymentMethod): Observable<WalletTopupResponse> {
    return this.http
      .post<ApiResponse<WalletTopupResponse>>(`${this.API}/wallet/topup`, { amount, payment_method })
      .pipe(map((res) => res.data));
  }

  confirmTopupTransfer(reference: string, payload: ConfirmBankTransferPayload): Observable<void> {
    const form = new FormData();
    form.append('bank_transfer_reference', payload.bank_transfer_reference);
    form.append('receipt', payload.receipt);
    return this.http
      .post<ApiResponse<null>>(`${this.API}/wallet/topup/${reference}/confirm-transfer`, form)
      .pipe(map(() => void 0));
  }

  getTopups(page = 1): Observable<{ data: WalletTopup[]; total: number }> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/wallet/topups?page=${page}`)
      .pipe(map((res) => ({
        data: ((res.data?.data ?? []) as any[]).map((t) => this.mapTopup(t)),
        total: res.data?.total ?? 0,
      })));
  }

  private mapTopup(raw: any): WalletTopup {
    return {
      id: raw.id,
      reference: raw.reference,
      amount: Number(raw.amount ?? 0),
      currency: raw.currency ?? 'USD',
      paymentMethod: raw.payment_method,
      status: raw.status,
      bankTransferReference: raw.bank_transfer_reference ?? null,
      receiptSubmittedAt: raw.receipt_submitted_at ?? null,
      rejectionReason: raw.rejection_reason ?? null,
      createdAt: raw.created_at ?? '',
    };
  }

  donateFromWallet(payload: DonateFromWalletPayload): Observable<DonateFromWalletResponse> {
    return this.http
      .post<ApiResponse<DonateFromWalletResponse>>(`${this.API}/donate/wallet`, payload)
      .pipe(map((res) => res.data));
  }
}
