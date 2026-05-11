import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/overview/dashboard-overview.component').then((m) => m.DashboardOverviewComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/donation-history.component').then((m) => m.DonationHistoryComponent),
  },
  {
    path: 'impact',
    loadComponent: () =>
      import('./pages/impact/donation-impact.component').then((m) => m.DonationImpactComponent),
  },
];
