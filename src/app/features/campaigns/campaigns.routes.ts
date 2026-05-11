import { Routes } from '@angular/router';

export const campaignsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/campaign-list/campaign-list.component').then((m) => m.CampaignListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/campaign-detail/campaign-detail.component').then((m) => m.CampaignDetailComponent),
  },
];
