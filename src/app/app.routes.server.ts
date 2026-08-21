import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public
  { path: 'home',                   renderMode: RenderMode.Client },
  { path: 'projects',               renderMode: RenderMode.Client },
  { path: 'projects/:id',           renderMode: RenderMode.Client },
  { path: 'campaigns',              renderMode: RenderMode.Client },
  { path: 'campaigns/:id',          renderMode: RenderMode.Client },
  { path: 'transparency',           renderMode: RenderMode.Client },
  { path: 'track',                  renderMode: RenderMode.Client },

  // Auth
  { path: 'auth/login',             renderMode: RenderMode.Client },
  { path: 'auth/register',          renderMode: RenderMode.Client },
  { path: 'auth/forgot-password',   renderMode: RenderMode.Client },
  { path: 'auth/reset-password',    renderMode: RenderMode.Client },
  { path: 'auth/verify-email',      renderMode: RenderMode.Client },

  // Donation
  { path: 'donate/guest',           renderMode: RenderMode.Client },
  { path: 'donate/general-fund',    renderMode: RenderMode.Client },
  { path: 'donate/success',         renderMode: RenderMode.Client },
  { path: 'donate/failed',          renderMode: RenderMode.Client },

  // Dashboard
  { path: 'dashboard',              renderMode: RenderMode.Client },
  { path: 'dashboard/history',      renderMode: RenderMode.Client },
  { path: 'dashboard/impact',       renderMode: RenderMode.Client },

  // Notifications & Profile
  { path: 'notifications',          renderMode: RenderMode.Client },
  { path: 'profile',                renderMode: RenderMode.Client },

  // Admin
  { path: 'admin',                  renderMode: RenderMode.Client },
  { path: 'admin/overview',         renderMode: RenderMode.Client },
  { path: 'admin/donations',        renderMode: RenderMode.Client },
  { path: 'admin/refunds',          renderMode: RenderMode.Client },
  { path: 'admin/campaigns',        renderMode: RenderMode.Client },
  { path: 'admin/reports',          renderMode: RenderMode.Client },

  // Error pages
  { path: 'unauthorized',           renderMode: RenderMode.Client },
  { path: 'server-error',           renderMode: RenderMode.Client },

  { path: '**',                     renderMode: RenderMode.Client },
];
