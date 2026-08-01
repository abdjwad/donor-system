// ── Damage-repair projects domain (real backend: DamageRequestController) ──

export interface CodeLabel {
  code: string;
  label: string;
}

export interface SortOptionItem {
  value: string;
  label: string;
}

export interface ProjectsFilterOptions {
  cities: string[];
  damageTypes: CodeLabel[];
  sortOptions: SortOptionItem[];
}

export interface RepairProject {
  id: number;
  requestNumber: string;
  title: string;
  titleAr: string;
  location: string;
  city: string;
  damageType: CodeLabel;
  status: CodeLabel;
  priority: number;
  totalEstimatedCost: number;
  fundingProgress: number;
  collectedAmount: number;
  completionPercentage: number;
  contractorName: string | null;
  familySize: number;
  createdAt: string;
  thumbnail: string | null;
}

export interface ProjectsStatistics {
  total: number;
  avgCompletion?: number;
  totalContractors?: number;
  perPage?: number;
  currentPage?: number;
  lastPage?: number;
}

export interface RepairProjectsResult {
  statistics: ProjectsStatistics;
  projects: RepairProject[];
  filtersApplied?: Record<string, unknown>;
}

export interface NeedFundingBeneficiary {
  name: string;
  city: string;
}

export interface NeedFundingProject {
  id: number;
  requestNumber: string;
  location: string;
  damageType: CodeLabel;
  description: string;
  totalEstimatedCost: number | null;
  collectedAmount: number;
  fundingProgress: number;
  remainingAmount: number;
  priority: number;
  images: string[];
  beneficiary: NeedFundingBeneficiary;
  createdAt: string;
}

export interface NeedFundingStatistics {
  totalProjects: number;
  totalAmountNeeded: number;
  avgFundingProgress: number;
}

export interface NeedFundingResult {
  statistics: NeedFundingStatistics;
  projects: NeedFundingProject[];
}

export interface AdvancedSearchParams {
  city?: string;
  damage_type?: string;
  funding_status?: 'needs_funding' | 'completed';
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  /** غير مؤكد ضمن عقد الـ API — يُرسل بشكل best-effort فقط */
  search?: string;
}
export interface ContractorBankInfo {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  iban: string | null;
}

export interface FundingCompletedContractor {
  id: number;
  name: string;
  companyName: string | null;
  bankInfo: ContractorBankInfo | null;
  hasBankInfo: boolean;
}

export interface FundingCompletedProject {
  id: number;
  requestNumber: string;
  location: string;
  damageType: CodeLabel;
  description: string;
  totalEstimatedCost: number | null;
  collectedAmount: number;
  fundingProgress: number;
  priority: number;
  contractor: FundingCompletedContractor | null;
  images: string[];
  beneficiary: NeedFundingBeneficiary;
  createdAt: string;
}

export interface FundingCompletedStatistics {
  totalProjects: number;
  totalAmountReady: number;
}

export interface FundingCompletedResult {
  statistics: FundingCompletedStatistics;
  projects: FundingCompletedProject[];
}

// ── Project execution progress (real backend: ProjectExecutionController::getProjectProgress) ──

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface MilestoneUpdate {
  id: number;
  completionPercentage: number;
  notes: string | null;
  images: string[];
  status: string;
  createdAt: string;
}

export interface ProjectMilestoneItem {
  id: number;
  order: number;
  name: string;
  status: MilestoneStatus;
  completionPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  latestUpdate: MilestoneUpdate | null;
}

export interface ProjectProgress {
  totalCompletion: number;
  status: string;
  contractorName: string | null;
  roadmap: ProjectMilestoneItem[];
}