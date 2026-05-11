import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProjectsFilterService, SortOption } from '../../services/projects-filter.service';

@Component({
  selector: 'app-projects-toolbar',
  standalone: true,
  imports: [TranslateModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './projects-toolbar.component.html',
  styleUrl: './projects-toolbar.component.scss',
})
export class ProjectsToolbarComponent {
  readonly filterService = inject(ProjectsFilterService);

  readonly sortOptions: { value: SortOption; labelKey: string }[] = [
    { value: 'newest',        labelKey: 'PROJECTS.SORT.NEWEST'       },
    { value: 'most_funded',   labelKey: 'PROJECTS.SORT.MOST_FUNDED'  },
    { value: 'most_urgent',   labelKey: 'PROJECTS.SORT.MOST_URGENT'  },
    { value: 'near_complete', labelKey: 'PROJECTS.SORT.NEAR_COMPLETE'},
  ];

  get shownCount(): number {
    return this.filterService.paginated().length;
  }

  get totalCount(): number {
    return this.filterService.totalCount();
  }

  get sortValue(): SortOption {
    return this.filterService.sortBy();
  }

  onSortChange(val: SortOption): void {
    this.filterService.setSort(val);
  }
}
