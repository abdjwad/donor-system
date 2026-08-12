// ── Public contractor showcase (real backend: TransparencyController::contractors) ──

export interface TrustedContractor {
  id: number;
  name: string;
  specializations: string[];
  yearsOfExperience: number;
  rating: number;
  ratingsCount: number;
  completedProjectsCount: number;
  memberSince: string;
}

export interface TrustedContractorsResult {
  total: number;
  contractors: TrustedContractor[];
}
