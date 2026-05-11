export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  role?: 'donor' | 'manager' | 'admin';
}
