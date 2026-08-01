// ── Admin: approved projects (real backend: DamageRequestController::getApprovedProjectsList) ──

export interface ApprovedProjectBeneficiary {
  id: number;
  name: string;
  phone: string;
}

export interface ApprovedProject {
  id: number;
  requestNumber: string;
  location: string;
  damageType: string; // 'partial' | 'total' | 'minor'
  priority: number | null;
  totalEstimatedCost: number | null;
  status: string; // 'approved'
  createdAt: string;
  beneficiary: ApprovedProjectBeneficiary;
  titleAr?: string | null;
  titleEn?: string | null;
  descriptionEn?: string | null;
  category?: string | null;
  donorsCount?: number;
  fundingProgress?: number;
  collectedAmount?: number;
}

export interface ProjectDisplayUpdate {
  title_ar?: string | null;
  title_en?: string | null;
  description_en?: string | null;
  category?: string | null;
}

export interface ApprovedProjectsStatistics {
  total: number;
  totalCost: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

export interface ApprovedProjectsResult {
  statistics: ApprovedProjectsStatistics;
  projects: ApprovedProject[];
}

// ── Project dossier: full detail (real backend: ProjectManagementService::getProjectDetails) ──

export interface ProjectDetailItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
}

export interface ProjectDetailBeneficiary {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string | null;
  birthDate: string | null;
  occupation: string | null;
  employmentType: string | null;
}

export interface ProjectDetailOverview {
  project: {
    id: number;
    requestNumber: string;
    location: string;
    damageType: string;
    description: string | null;
    priority: number | null;
    status: string;
    estimatedCost: number | null;
    totalEstimatedCost: number | null;
    createdAt: string;
    approvedAt: string | null;
  };
  beneficiary: ProjectDetailBeneficiary;
  items: ProjectDetailItem[];
  approvedBy: { id: number; name: string } | null;
}
