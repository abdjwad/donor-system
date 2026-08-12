import { Component, computed, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';

import { Project } from '../../../../core/models/project.model';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, DecimalPipe],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;

  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  private static readonly CATEGORY_ICONS: Record<string, string> = {
    housing: 'home',
    education: 'school',
    health: 'medical_services',
    infrastructure: 'construction',
    water: 'water_drop',
  };

  get progressPct(): number {
    if (!this.project.fundingGoal) return 0;
    return Math.min(100, (this.project.amountRaised / this.project.fundingGoal) * 100);
  }

  get remaining(): number {
    return Math.max(0, this.project.fundingGoal - this.project.amountRaised);
  }

  get categoryIcon(): string {
    return ProjectCardComponent.CATEGORY_ICONS[this.project.category] ?? 'category';
  }

  get isAlmostFunded(): boolean {
    return this.project.status === 'active' && this.progressPct >= 90 && this.progressPct < 100;
  }

  get title(): string {
    return this.isRtl() ? this.project.titleAr : this.project.title;
  }

  get location(): string {
    return this.isRtl() ? (this.project.locationAr ?? this.project.location) : this.project.location;
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }
}
