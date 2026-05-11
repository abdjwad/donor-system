import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';

import { GuestDonation, GuestDonationResponse } from '../../../core/models/guest-donation.model';
import { Project } from '../../../core/models/project.model';
import { MOCK_PROJECTS } from '../../home/data/mock-data';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = '/api';

  readonly donationState = signal<Partial<GuestDonation>>({
    currency: 'USD',
    donation_type: 'one_time',
    payment_method: 'stripe',
    is_anonymous: false,
  });

  private projects$?: Observable<Project[]>;

  updateState(partial: Partial<GuestDonation>): void {
    this.donationState.update((s) => ({ ...s, ...partial }));
  }

  resetState(): void {
    this.donationState.set({
      currency: 'USD',
      donation_type: 'one_time',
      payment_method: 'stripe',
      is_anonymous: false,
    });
  }

  submitGuestDonation(payload: GuestDonation): Observable<GuestDonationResponse> {
    return this.http.post<GuestDonationResponse>(
      `${this.API_BASE}/guest-donations`,
      payload
    );
  }

  getProjects(): Observable<Project[]> {
    if (!this.projects$) {
      // Swap for real API when backend is ready:
      // this.projects$ = this.http.get<Project[]>(`${this.API_BASE}/projects`).pipe(shareReplay(1));
      this.projects$ = of(MOCK_PROJECTS).pipe(shareReplay(1));
    }
    return this.projects$;
  }
}
