export interface AppNotification {
  id: string;
  type: string;
  messageAr: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  unreadCount: number;
  notifications: AppNotification[];
  total: number;
  currentPage: number;
  lastPage: number;
}

export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  donation_status: 'volunteer_activism',
  wallet_topup_status: 'account_balance_wallet',
  funding_completed: 'trending_up',
  project_completed: 'check_circle',
  disbursement_report_submitted: 'description',
  disbursement_ops_approved: 'fact_check',
  disbursement_rejected: 'cancel',
  disbursement_transferred: 'payments',
};

export function notificationIcon(n: AppNotification): string {
  return NOTIFICATION_TYPE_ICONS[n.type] ?? 'notifications';
}
