import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LanguageService } from '../../../../core/services/language.service';
import { Project } from '../../../../core/models/project.model';
import { MOCK_PROJECTS } from '../../../home/data/mock-data';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';

interface Milestone {
  titleAr: string; titleEn: string;
  dateAr: string;  dateEn: string;
  status: 'completed' | 'ongoing' | 'pending';
  descriptionAr: string; descriptionEn: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, MatButtonModule, MatIconModule,
            NavbarComponent, SiteFooterComponent, ProjectCardComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  @Input() id = '';

  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  project = signal<Project | null>(null);
  related = signal<Project[]>([]);
  activeImage = signal(0);

  readonly GALLERY_EXTRAS = [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80',
    'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=800&q=80',
  ];

  readonly MILESTONES: Milestone[] = [
    { titleAr: 'المسح الميداني',  titleEn: 'Field Survey',    dateAr: 'يناير 2025',  dateEn: 'Jan 2025',  status: 'completed', descriptionAr: 'تم حصر الأضرار وتقييم الاحتياجات',       descriptionEn: 'Damage assessment and needs evaluation completed' },
    { titleAr: 'تأمين الموارد',  titleEn: 'Resource Securing', dateAr: 'مارس 2025',   dateEn: 'Mar 2025',  status: 'completed', descriptionAr: 'تأمين المواد والمقاولين',                 descriptionEn: 'Materials and contractors secured' },
    { titleAr: 'بدء الأعمال',    titleEn: 'Construction Start', dateAr: 'مايو 2025',   dateEn: 'May 2025',  status: 'ongoing',   descriptionAr: 'جارية أعمال البناء على قدم وساق',         descriptionEn: 'Construction work in full swing' },
    { titleAr: 'التسليم النهائي', titleEn: 'Final Handover',   dateAr: 'سبتمبر 2025', dateEn: 'Sep 2025',  status: 'pending',   descriptionAr: 'تسليم المشروع للمستفيدين',               descriptionEn: 'Handover to beneficiaries' },
  ];

  ngOnInit(): void {
    const pid = parseInt(this.id, 10);
    const found = MOCK_PROJECTS.find((p) => p.id === pid) ?? MOCK_PROJECTS[0];
    this.project.set(found);
    this.related.set(MOCK_PROJECTS.filter((p) => p.id !== found.id && p.category === found.category).slice(0, 3));
    if (this.related().length < 3) {
      this.related.set(MOCK_PROJECTS.filter((p) => p.id !== found.id).slice(0, 3));
    }
  }

  get images(): string[] {
    const p = this.project();
    if (!p) return [];
    return [p.imageUrl, ...this.GALLERY_EXTRAS];
  }

  get progressPct(): number {
    const p = this.project();
    if (!p || !p.fundingGoal) return 0;
    return Math.min(100, Math.round((p.amountRaised / p.fundingGoal) * 100));
  }

  formatAmount(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
  }

  setImage(i: number): void { this.activeImage.set(i); }

  getTitle(p: Project): string { return this.isRtl() ? p.titleAr : p.title; }
  getLocation(p: Project): string { return this.isRtl() ? (p.locationAr ?? p.location) : p.location; }
  getMilestoneTitle(m: Milestone): string { return this.isRtl() ? m.titleAr : m.titleEn; }
  getMilestoneDate(m: Milestone): string { return this.isRtl() ? m.dateAr : m.dateEn; }
  getMilestoneDesc(m: Milestone): string { return this.isRtl() ? m.descriptionAr : m.descriptionEn; }
}
