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

  formatCurrency(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n;
  }
}
