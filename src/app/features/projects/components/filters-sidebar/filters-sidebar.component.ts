import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { ProjectCategory, ProjectStatus, ProjectUrgency } from '../../../../core/models/project.model';
import { ProjectsFilterService } from '../../services/projects-filter.service';

@Component({
  selector: 'app-filters-sidebar',
  standalone: true,
  imports: [TranslateModule, MatCheckboxModule, MatRadioModule, MatButtonModule],
  templateUrl: './filters-sidebar.component.html',
  styleUrl: './filters-sidebar.component.scss',
})
export class FiltersSidebarComponent {
  readonly filterService = inject(ProjectsFilterService);

  readonly categories: ProjectCategory[] = ['housing', 'education', 'health', 'infrastructure', 'water'];
  readonly urgencies: ProjectUrgency[]   = ['high', 'medium', 'low'];
  readonly statuses: (ProjectStatus | 'all')[] = ['all', 'active', 'completed', 'paused'];

  isCategory(cat: ProjectCategory): boolean {
    return this.filterService.filters().categories.includes(cat);
  }

  isUrgency(urg: ProjectUrgency): boolean {
    return this.filterService.filters().urgencies.includes(urg);
  }

  isLocation(loc: string): boolean {
    return this.filterService.filters().locations.includes(loc);
  }
}
