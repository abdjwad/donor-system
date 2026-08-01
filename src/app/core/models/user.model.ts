export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: 'donor' | 'beneficiary' | 'contractor' | 'regional_supervisor' | 'operations_manager' | 'donation_manager' | 'admin' | 'super_admin';
  lang?: 'ar' | 'en';
  avatar?: string | null;
  permissions?: string[];
}
