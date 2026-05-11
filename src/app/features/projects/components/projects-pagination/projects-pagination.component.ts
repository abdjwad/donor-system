import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectsFilterService } from '../../services/projects-filter.service';

@Component({
  selector: 'app-projects-pagination',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './projects-pagination.component.html',
  styleUrl: './projects-pagination.component.scss',
})
export class ProjectsPaginationComponent {
  readonly filterService = inject(ProjectsFilterService);

  readonly pages = computed(() => {
    const total = this.filterService.totalPages();
    const current = this.filterService.page();
    const pages: (number | '...')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  goTo(p: number | '...'): void {
    if (typeof p === 'number') this.filterService.setPage(p);
  }

  prev(): void {
    const cur = this.filterService.page();
    if (cur > 1) this.filterService.setPage(cur - 1);
  }

  next(): void {
    const cur = this.filterService.page();
    if (cur < this.filterService.totalPages()) this.filterService.setPage(cur + 1);
  }
}
