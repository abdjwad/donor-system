import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApprovedProjectsApiService } from '../../../../core/services/admin-approved-projects-api.service';
import { ApprovedProject, ApprovedProjectsStatistics } from '../../../../core/models/approved-project.model';

const EMPTY_STATISTICS: ApprovedProjectsStatistics = {
  total: 0,
  totalCost: 0,
  highPriority: 0,
  mediumPriority: 0,
  lowPriority: 0,
};

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [DecimalPipe, TranslateModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './admin-projects.component.html',
  styleUrl: './admin-projects.component.scss',
})
export class AdminProjectsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly approvedProjectsApi = inject(AdminApprovedProjectsApiService);
  private readonly fb = inject(FormBuilder);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  readonly projects = signal<ApprovedProject[]>([]);
  readonly statistics = signal<ApprovedProjectsStatistics>(EMPTY_STATISTICS);
  readonly loading = signal(true);
  readonly statusFilter = signal<string>('all');

  readonly showEditForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly editForm = this.fb.group({
    title_ar: [''],
    title_en: [''],
    description_en: [''],
    category: ['housing', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.approvedProjectsApi.getApprovedProjects(this.statusFilter()).subscribe({
      next: (res) => {
        this.projects.set(res.projects);
        this.statistics.set(res.statistics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.load();
  }

  damageTypeKey(damageType: string): string {
    return 'PROJECTS.REPAIR.DAMAGE_TYPE.' + damageType.toUpperCase();
  }

  statusKey(status: string): string {
    return 'PROJECTS.REPAIR.STATUS.' + status.toUpperCase();
  }

  // "awaiting_contractor" بيضل هو نص الحالة بقاعدة البيانات لحد ما التمويل يوصل 100%،
  // حتى لو انعيّن مقاول فعلياً — فبنعرض label مختلف بهالحالة بالذات حتى ما توهم الأدمن
  // إنه ما في مقاول أصلاً
  statusLabelKey(p: ApprovedProject): string {
    if (p.status === 'awaiting_contractor' && p.hasContractor) {
      return 'PROJECTS.REPAIR.STATUS.CONTRACTOR_ASSIGNED_PENDING_FUNDING';
    }
    return this.statusKey(p.status);
  }

  priorityClass(priority: number | null): 'high' | 'medium' | 'low' | 'none' {
    if (priority === null) return 'none';
    if (priority === 1) return 'high';
    if (priority <= 3) return 'medium';
    return 'low';
  }

  openEdit(p: ApprovedProject): void {
    this.editingId.set(p.id);
    this.editForm.reset({
      title_ar: p.titleAr ?? '',
      title_en: p.titleEn ?? '',
      description_en: p.descriptionEn ?? '',
      category: p.category ?? 'housing',
    });
    this.showEditForm.set(true);
  }

  submitEdit(): void {
    const id = this.editingId();
    if (!id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.approvedProjectsApi.updateProjectDisplay(id, this.editForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEditForm.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
