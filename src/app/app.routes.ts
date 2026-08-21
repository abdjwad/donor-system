import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ── Public ────────────────────────────────────────────────────
  { path: 'home',         loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes) },
  { path: 'projects',     loadChildren: () => import('./features/projects/projects.routes').then(m => m.projectsRoutes) },
  { path: 'campaigns',    loadChildren: () => import('./features/campaigns/campaigns.routes').then(m => m.campaignsRoutes) },
  { path: 'transparency', loadComponent: () => import('./features/transparency/transparency.component').then(m => m.TransparencyComponent) },
  { path: 'track',        loadComponent: () => import('./features/track/pages/track-donation/track-donation.component').then(m => m.TrackDonationComponent) },

  // ── Auth ──────────────────────────────────────────────────────
  { path: 'auth',         loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes) },

  // ── Donation flows ────────────────────────────────────────────
  { path: 'donate',       loadChildren: () => import('./features/donate/donate.routes').then(m => m.donateRoutes) },

  // ── Donor dashboard (protected) ───────────────────────────────
  { path: 'dashboard',    canActivate: [authGuard], loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes) },
  { path: 'notifications',canActivate: [authGuard], loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationsRoutes) },
  { path: 'profile',      canActivate: [authGuard], loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes) },

  // ── Admin (admin/super_admin فقط) ─────────────────────────────
  { path: 'admin',        canActivate: [adminGuard], loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes) },

  // ── Error pages ───────────────────────────────────────────────
  { path: 'unauthorized', loadComponent: () => import('./features/errors/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: 'server-error', loadComponent: () => import('./features/errors/server-error/server-error.component').then(m => m.ServerErrorComponent) },

  // ── 404 ───────────────────────────────────────────────────────
  { path: '**', loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
