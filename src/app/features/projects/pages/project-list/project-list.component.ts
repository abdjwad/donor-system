import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LanguageService } from '../../../../core/services/language.service';
import { ProjectsFilterService } from '../../services/projects-filter.service';
import { RepairProjectCardComponent } from '../../components/repair-project-card/repair-project-card.component';
import { FiltersSidebarComponent } from '../../components/filters-sidebar/filters-sidebar.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { ProjectsToolbarComponent } from '../../components/projects-toolbar/projects-toolbar.component';
import { ProjectsPaginationComponent } from '../../components/projects-pagination/projects-pagination.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    NavbarComponent,
    SiteFooterComponent,
    RepairProjectCardComponent,
    FiltersSidebarComponent,
    SearchBarComponent,
    ProjectsToolbarComponent,
    ProjectsPaginationComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  readonly filterService = inject(ProjectsFilterService);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly projects = this.filterService.paginated;
  readonly totalCount = this.filterService.totalCount;
  readonly loading = this.filterService.loading;

  ngOnInit(): void {
    this.filterService.loadFilterOptions();
    this.filterService.load();
  }
}
