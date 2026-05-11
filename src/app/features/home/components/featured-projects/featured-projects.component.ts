import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MOCK_PROJECTS } from '../../data/mock-data';
import { ProjectCardComponent } from '../../../projects/components/project-card/project-card.component';

@Component({
  selector: 'app-featured-projects',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, ProjectCardComponent],
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
})
export class FeaturedProjectsComponent {
  readonly projects = MOCK_PROJECTS.filter((p) => p.featured).slice(0, 6);
}
