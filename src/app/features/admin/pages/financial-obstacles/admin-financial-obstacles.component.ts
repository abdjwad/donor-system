import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import {
  AdminApiService,
  FinancialObstacle,
  FinancialObstacleStatus,
  FinancialObstaclesResult,
} from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-financial-obstacles',
  standalone: true,
  imports: [TranslateModule, FormsModule, MatButtonModule],
  templateUrl: './admin-financial-obstacles.component.html',
  styleUrl:    './admin-financial-obstacles.component.scss',
})
export class AdminFinancialObstaclesComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  private readonly empty: FinancialObstaclesResult = {
    statistics: { total_financial_obstacles: 0, total_amount_needed: 0, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0 },
    obstacles: [],
  };

  result  = signal<FinancialObstaclesResult>(this.empty);
  loading = signal(true);
  error   = signal<string | null>(null);
  filterStatus = signal<FinancialObstacleStatus>('open');

  // Fund modal
  showFundModal  = signal(false);
  fundTarget     = signal<FinancialObstacle | null>(null);
  fundAmount     = 0;
  fundNotes      = '';
  fundSubmitting = signal(false);

  // Reject modal
  showRejectModal  = signal(false);
  rejectTargetId   = signal<number | null>(null);
  rejectReason     = signal('');
  rejectSubmitting = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi.getFinancialObstacles(this.filterStatus()).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: (err: Error) => { this.error.set(err.message); this.loading.set(false); },
    });
  }

  onFilterChange(status: FinancialObstacleStatus): void {
    this.filterStatus.set(status);
    this.load();
  }

  isDecidable(o: FinancialObstacle): boolean {
    return o.status === 'pending' || o.status === 'in_progress';
  }

  openFund(o: FinancialObstacle): void {
    this.fundTarget.set(o);
    this.fundAmount = o.amount_required || 0;
    this.fundNotes  = '';
    this.showFundModal.set(true);
  }

  confirmFund(): void {
    const target = this.fundTarget();
    if (!target || this.fundAmount <= 0) return;
    this.fundSubmitting.set(true);
    this.adminApi.fundObstacle(target.id, +this.fundAmount, this.fundNotes || undefined).subscribe({
      next: () => { this.showFundModal.set(false); this.fundSubmitting.set(false); this.load(); },
      error: () => this.fundSubmitting.set(false),
    });
  }

  openReject(id: number): void {
    this.rejectTargetId.set(id);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const id = this.rejectTargetId();
    const reason = this.rejectReason().trim();
    if (!id || !reason) return;
    this.rejectSubmitting.set(true);
    this.adminApi.rejectObstacleFunding(id, reason).subscribe({
      next: () => { this.showRejectModal.set(false); this.rejectSubmitting.set(false); this.load(); },
      error: () => this.rejectSubmitting.set(false),
    });
  }

  severityBadgeClass(s: string): string {
    const map: Record<string, string> = { critical: 'failed', high: 'pending', medium: 'pending', low: 'completed' };
    return map[s] ?? 'pending';
  }

  statusBadgeClass(s: string): string {
    const map: Record<string, string> = { funded: 'completed', rejected: 'failed', pending: 'pending', in_progress: 'pending' };
    return map[s] ?? s;
  }
}
