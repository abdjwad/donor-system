import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProjectsFilterService } from '../../services/projects-filter.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private readonly filterService = inject(ProjectsFilterService);
  private readonly destroy$ = new Subject<void>();
  private readonly input$ = new Subject<string>();

  searchValue = '';

  ngOnInit(): void {
    this.input$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((q) => this.filterService.setSearch(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string): void {
    this.searchValue = value;
    this.input$.next(value);
  }

  clear(): void {
    this.searchValue = '';
    this.filterService.setSearch('');
  }
}
