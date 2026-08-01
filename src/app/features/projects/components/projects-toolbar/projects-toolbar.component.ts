import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProjectsFilterService } from '../../services/projects-filter.service';

@Component({
  selector: 'app-projects-toolbar',
  standalone: true,
  imports: [TranslateModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './projects-toolbar.component.html',
  styleUrl: './projects-toolbar.component.scss',
})
export class ProjectsToolbarComponent {
  readonly filterService = inject(ProjectsFilterService);
  private readonly translate = inject(TranslateService);

  get sortOptions(): { value: string; labelKey: string }[] {
    const options = this.filterService.filterOptions()?.sortOptions ?? [];
    return options.map((o) => ({ value: o.value, labelKey: 'PROJECTS.REPAIR.SORT.' + o.value.toUpperCase() }));
  }

  get shownCount(): number {
    return this.filterService.paginated().length;
  }

  get totalCount(): number {
    return this.filterService.totalCount();
  }

  get sortValue(): string {
    return this.filterService.sortBy();
  }

  get sortDirection(): 'asc' | 'desc' {
    return this.filterService.sortDirection();
  }

  get sortDirectionTitle(): string {
    const key = this.sortDirection === 'asc' ? 'PROJECTS.SORT.ASC' : 'PROJECTS.SORT.DESC';
    return this.translate.instant(key);
  }

  onSortChange(val: string): void {
    this.filterService.setSort(val);
  }

  toggleSortDirection(): void {
    this.filterService.toggleSortDirection();
  }
}
