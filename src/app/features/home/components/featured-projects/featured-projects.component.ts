import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { ProjectsApiService } from '../../../../core/services/projects-api.service';
import { Project } from '../../../../core/models/project.model';
import { ProjectCardComponent } from '../../../projects/components/project-card/project-card.component';

@Component({
  selector: 'app-featured-projects',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, ProjectCardComponent],
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
})
export class FeaturedProjectsComponent implements OnInit {
  private readonly api = inject(ProjectsApiService);
  readonly projects = signal<Project[]>([]);

  ngOnInit(): void {
    this.api.getFeatured().subscribe({ next: (p) => this.projects.set(p) });
  }
}
