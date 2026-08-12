import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { requirePermission } from '../../core/guards/permission.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        canActivate: [requirePermission('view public dashboard')],
        loadComponent: () => import('./pages/overview/admin-overview.component').then(m => m.AdminOverviewComponent),
      },
      {
        path: 'donations',
        canActivate: [requirePermission('manage donations')],
        loadComponent: () => import('./pages/donations/admin-donations.component').then(m => m.AdminDonationsComponent),
      },
      {
        path: 'refunds',
        canActivate: [requirePermission('manage donations')],
        loadComponent: () => import('./pages/refunds/admin-refunds.component').then(m => m.AdminRefundsComponent),
      },
      {
        path: 'wallet-topups',
        canActivate: [requirePermission('manage donations')],
        loadComponent: () => import('./pages/wallet-topups/admin-wallet-topups.component').then(m => m.AdminWalletTopupsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent),
      },
      {
        path: 'campaigns',
        canActivate: [requirePermission('manage campaigns')],
        loadComponent: () => import('./pages/campaigns/admin-campaigns.component').then(m => m.AdminCampaignsComponent),
      },
      {
        path: 'projects',
        canActivate: [requirePermission('view donations')],
        loadComponent: () => import('./pages/projects/admin-projects.component').then(m => m.AdminProjectsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/admin-reports.component').then(m => m.AdminReportsComponent),
      },
      {
        path: 'disbursements',
        loadComponent: () => import('./pages/disbursements/admin-disbursements.component').then(m => m.AdminDisbursementsComponent),
      },
      {
        path: 'disbursements/:id',
        loadComponent: () => import('./pages/disbursement-detail/admin-disbursement-detail.component').then(m => m.AdminDisbursementDetailComponent),
      },
      {
        path: 'projects/:id',
        canActivate: [requirePermission('view donations')],
        loadComponent: () => import('./pages/project-dossier/admin-project-dossier.component').then(m => m.AdminProjectDossierComponent),
      },
      {
        path: 'wallet-settings',
        canActivate: [requirePermission('manage settings')],
        loadComponent: () => import('./pages/wallet-settings/admin-wallet-settings.component').then(m => m.AdminWalletSettingsComponent),
      },
      {
        path: 'financial-ledger',
        canActivate: [requirePermission('manage donations')],
        loadComponent: () => import('./pages/financial-ledger/admin-financial-ledger.component').then(m => m.AdminFinancialLedgerComponent),
      },
      {
        path: 'financial-obstacles',
        canActivate: [requirePermission('manage donations')],
        loadComponent: () => import('./pages/financial-obstacles/admin-financial-obstacles.component').then(m => m.AdminFinancialObstaclesComponent),
      },
    ],
  },
];
