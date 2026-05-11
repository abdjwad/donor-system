import { Routes } from '@angular/router';

export const notificationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component').then(
        (m) => m.NotificationCenterComponent
      ),
  },
];
