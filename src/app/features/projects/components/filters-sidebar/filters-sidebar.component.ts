import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { ProjectsFilterService } from '../../services/projects-filter.service';

@Component({
  selector: 'app-filters-sidebar',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './filters-sidebar.component.html',
  styleUrl: './filters-sidebar.component.scss',
})
export class FiltersSidebarComponent {
  readonly filterService = inject(ProjectsFilterService);

  resetFilters(): void {
    this.filterService.reset();
  }
}
