import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

import { RepairProject } from '../../../../core/models/repair-project.model';
import { LanguageService } from '../../../../core/services/language.service';

const FALLBACK_THUMBNAIL = 'assets/images/project-placeholder.svg';
const DONATABLE_STATUSES = ['approved'];
const EXECUTION_STARTED_STATUSES = ['in_progress', 'completed'];

@Component({
  selector: 'app-repair-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, MatButtonModule],
  templateUrl: './repair-project-card.component.html',
  styleUrl: './repair-project-card.component.scss',
})
export class RepairProjectCardComponent {
  private readonly langService = inject(LanguageService);

  @Input({ required: true }) project!: RepairProject;

  get title(): string {
    return this.langService.currentLang() === 'ar'
      ? (this.project.titleAr || this.project.title)
      : (this.project.title || this.project.titleAr);
  }

  get thumbnailUrl(): string {
    return this.project.thumbnail || FALLBACK_THUMBNAIL;
  }

  private static readonly DAMAGE_ICONS: Record<string, string> = {
    minor: 'handyman',
    partial: 'construction',
    total: 'report_problem',
  };

  get damageIcon(): string {
    return RepairProjectCardComponent.DAMAGE_ICONS[this.project.damageType.code] ?? 'construction';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.indexOf(FALLBACK_THUMBNAIL) === -1) {
      img.src = FALLBACK_THUMBNAIL;
    }
  }

  get fundingProgressPct(): number {
    return Math.min(100, Math.max(0, this.project.fundingProgress));
  }

  get completionPct(): number {
    return Math.min(100, Math.max(0, this.project.completionPercentage));
  }

  get isCompleted(): boolean {
    return this.project.status.code === 'completed';
  }

  get showCompletion(): boolean {
    return EXECUTION_STARTED_STATUSES.includes(this.project.status.code);
  }

  get canDonate(): boolean {
    return DONATABLE_STATUSES.includes(this.project.status.code) && this.fundingProgressPct < 100;
  }

  get isAlmostFunded(): boolean {
    return this.project.status.code === 'approved' && this.fundingProgressPct >= 90 && this.fundingProgressPct < 100;
  }

  // "awaiting_contractor" بيضل نص الحالة لحد ما التمويل يوصل 100% حتى لو انعيّن
  // مقاول فعلياً — فبدون هالتفريق المتبرع بيشوف "بانتظار مقاول" رغم إنه المقاول
  // موجود أصلاً (نفس اللبس يلي انصلح بلوحة الأدمن — هون بنفس المنطق للمتبرع)
  get statusLabelKey(): string {
    if (this.project.status.code === 'awaiting_contractor' && this.project.contractorName) {
      return 'PROJECTS.REPAIR.STATUS.CONTRACTOR_ASSIGNED_PENDING_FUNDING';
    }
    return 'PROJECTS.REPAIR.STATUS.' + this.project.status.code.toUpperCase();
  }

  formatCurrency(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n;
  }
}
