import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TrustedContractor } from '../../../../core/models/trusted-contractor.model';

const AVATAR_PALETTE = ['#1B6B3A', '#C5952A', '#1A2D5A', '#27AE60', '#A07820', '#2E8B57'];

@Component({
  selector: 'app-trusted-contractors',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './trusted-contractors.component.html',
  styleUrl: './trusted-contractors.component.scss',
})
export class TrustedContractorsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly contractors = signal<TrustedContractor[]>([]);
  readonly loading      = signal(true);

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/transparency/contractors`)
      .pipe(
        map(res => (res.data?.contractors ?? []) as any[]),
        map(list => list.slice(0, 6).map((c): TrustedContractor => ({
          id: c.id,
          name: c.name ?? '',
          specializations: c.specializations ?? [],
          yearsOfExperience: Number(c.years_of_experience ?? 0),
          rating: Number(c.rating ?? 0),
          ratingsCount: Number(c.ratings_count ?? 0),
          completedProjectsCount: Number(c.completed_projects_count ?? 0),
          memberSince: c.member_since ?? '',
        }))),
        catchError(() => of([] as TrustedContractor[])),
      )
      .subscribe(list => { this.contractors.set(list); this.loading.set(false); });
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[1].charAt(0);
  }

  avatarColor(id: number): string {
    return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
  }

  stars(rating: number): ('full' | 'half' | 'empty')[] {
    const result: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) result.push('full');
      else if (rating >= i - 0.5) result.push('half');
      else result.push('empty');
    }
    return result;
  }
}
