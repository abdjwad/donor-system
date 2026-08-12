import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfirmBankTransferPayload, GuestDonation, GuestDonationResponse, WalletInfo } from '../../../core/models/guest-donation.model';
import { CryptoConfirmPayload, CryptoConfirmResponse } from '../../../core/models/blockchain.model';
import { ApiResponse } from '../../../core/models/auth-response.models';
import { ProjectsApiService } from '../../../core/services/projects-api.service';
import { Project } from '../../../core/models/project.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private readonly http        = inject(HttpClient);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly API         = `${environment.apiUrl}/v1`;

  readonly donationState = signal<Partial<GuestDonation>>({
    currency:       'USD',
    donation_type:  'one_time',
    payment_method: 'stripe',
    is_anonymous:   false,
  });

  updateState(partial: Partial<GuestDonation>): void {
    this.donationState.update((s) => ({ ...s, ...partial }));
  }

  resetState(): void {
    this.donationState.set({
      currency:       'USD',
      donation_type:  'one_time',
      payment_method: 'stripe',
      is_anonymous:   false,
    });
  }

  // ── Guest donation ─────────────────────────────────────────────
  submitGuestDonation(payload: GuestDonation): Observable<GuestDonationResponse> {
    return this.http
      .post<ApiResponse<GuestDonationResponse>>(`${this.API}/donate/guest`, payload)
      .pipe(map((res) => res.data));
  }

  // ── Authenticated donation ─────────────────────────────────────
  submitAuthDonation(payload: Partial<GuestDonation>): Observable<GuestDonationResponse> {
    return this.http
      .post<ApiResponse<GuestDonationResponse>>(`${this.API}/donate/authenticated`, payload)
      .pipe(map((res) => res.data));
  }

  // ── تسجيل تبرع نُفّذ فعلياً على البلوكتشين بالسجل الرسمي ─────────
  confirmCrypto(payload: CryptoConfirmPayload): Observable<CryptoConfirmResponse> {
    return this.http
      .post<ApiResponse<CryptoConfirmResponse>>(`${this.API}/donate/crypto-confirm`, payload)
      .pipe(map((res) => res.data));
  }

  // ── Verify donation by reference ───────────────────────────────
  getDonationByRef(ref: string): Observable<GuestDonationResponse> {
    return this.http
      .get<ApiResponse<GuestDonationResponse>>(`${this.API}/donate/success/${ref}`)
      .pipe(map((res) => res.data));
  }

  // ── Active platform wallet (bank transfer donations) ────────────
  getActiveWallet(): Observable<WalletInfo> {
    return this.http
      .get<ApiResponse<WalletInfo>>(`${this.API}/wallets/active`)
      .pipe(map((res) => res.data));
  }

  // ── Confirm bank transfer (step 2 of the bank donation flow) ────
  confirmBankTransfer(reference: string, payload: ConfirmBankTransferPayload): Observable<void> {
    const form = new FormData();
    form.append('bank_transfer_reference', payload.bank_transfer_reference);
    form.append('receipt', payload.receipt);
    return this.http
      .post<ApiResponse<null>>(`${this.API}/donate/${reference}/confirm-transfer`, form)
      .pipe(map(() => void 0));
  }

  // ── Dashboard stats ────────────────────────────────────────────
  getDashboardStats(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/dashboard/stats`)
      .pipe(map((res) => res.data));
  }

  // ── Donation history ───────────────────────────────────────────
  getHistory(page = 1): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.API}/dashboard/history?page=${page}`)
      .pipe(map((res) => res.data));
  }

  // ── Get projects list (for amount form dropdown) ───────────────
  getProjects(): Observable<Project[]> {
    return this.projectsApi.getProjects({ per_page: 48 }).pipe(map((res) => res.data));
  }
}
