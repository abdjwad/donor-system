export type ProjectCategory = 'housing' | 'education' | 'health' | 'infrastructure' | 'water';
export type ProjectUrgency = 'high' | 'medium' | 'low';
export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface Project {
  id: number;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  location: string;
  locationAr?: string;
  imageUrl: string;
  fundingGoal: number;
  amountRaised: number;
  donors: number;
  status: ProjectStatus;
  category: ProjectCategory;
  urgency: ProjectUrgency;
  daysActive: number;
  featured?: boolean;
}

export interface Campaign {
  id: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  targetAmount: number;
  raisedAmount: number;
  daysLeft: number;
  donorCount: number;
  featured: boolean;
}

export interface Testimonial {
  id: number;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  textAr: string;
  textEn: string;
  initials: string;
  avatarColor: string;
  rating: number;
}

export interface PlatformStats {
  donors: number;
  families: number;
  projects: number;
  totalAmount: number;
}
