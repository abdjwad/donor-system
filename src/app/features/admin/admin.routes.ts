import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./pages/overview/admin-overview.component').then(m => m.AdminOverviewComponent),
      },
      {
        path: 'donations',
        loadComponent: () => import('./pages/donations/admin-donations.component').then(m => m.AdminDonationsComponent),
      },
      {
        path: 'refunds',
        loadComponent: () => import('./pages/refunds/admin-refunds.component').then(m => m.AdminRefundsComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./pages/campaigns/admin-campaigns.component').then(m => m.AdminCampaignsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/admin-reports.component').then(m => m.AdminReportsComponent),
      },
    ],
  },
];
