import { Routes } from '@angular/router';

export const donateRoutes: Routes = [
  { path: '', redirectTo: 'guest', pathMatch: 'full' },
  {
    path: 'guest',
    loadComponent: () =>
      import('./pages/guest-checkout/guest-checkout.component').then((m) => m.GuestCheckoutComponent),
  },
  {
    path: 'general-fund',
    loadComponent: () =>
      import('./pages/general-fund/general-fund.component').then((m) => m.GeneralFundComponent),
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/donation-success/donation-success.component').then((m) => m.DonationSuccessComponent),
  },
  {
    path: 'failed',
    loadComponent: () =>
      import('./pages/payment-failed/payment-failed.component').then((m) => m.PaymentFailedComponent),
  },
];
