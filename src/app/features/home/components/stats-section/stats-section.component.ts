import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PLATFORM_STATS } from '../../data/mock-data';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './stats-section.component.html',
  styleUrl: './stats-section.component.scss',
})
export class StatsSectionComponent {
  readonly stats = PLATFORM_STATS;
}
