import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public pages
  { path: 'home',         loadChildren: () => import('./features/home/home.routes').then((m) => m.homeRoutes) },
  { path: 'projects',     loadChildren: () => import('./features/projects/projects.routes').then((m) => m.projectsRoutes) },
  { path: 'campaigns',    loadChildren: () => import('./features/campaigns/campaigns.routes').then((m) => m.campaignsRoutes) },
  { path: 'transparency', loadComponent: () => import('./features/transparency/transparency.component').then((m) => m.TransparencyComponent) },

  // Auth
  { path: 'auth',         loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes) },

  // Donation flows
  { path: 'donate',       loadChildren: () => import('./features/donate/donate.routes').then((m) => m.donateRoutes) },

  // Dashboard (protected)
  { path: 'dashboard',    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes) },

  // Notifications
  { path: 'notifications', loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.notificationsRoutes) },

  // Profile
  { path: 'profile',      loadChildren: () => import('./features/profile/profile.routes').then((m) => m.profileRoutes) },

  // Admin
  { path: 'admin',        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes) },

  // Error pages
  { path: 'unauthorized', loadComponent: () => import('./features/errors/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent) },
  { path: 'server-error', loadComponent: () => import('./features/errors/server-error/server-error.component').then((m) => m.ServerErrorComponent) },

  // 404 — must be last
  { path: '**',           loadComponent: () => import('./features/errors/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];
