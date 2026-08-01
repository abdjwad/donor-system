import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface Stats { donors: number; families: number; projects: number; amount: number; }

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './stats-section.component.html',
  styleUrl: './stats-section.component.scss',
})
export class StatsSectionComponent implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private animTimer: ReturnType<typeof setInterval> | null = null;

  readonly display    = signal<Stats>({ donors: 0, families: 0, projects: 0, amount: 0 });
  readonly isLoaded   = signal(false);
  readonly flashing   = signal(false);
  readonly secondsAgo = signal(0);

  readonly lastUpdatedLabel = computed(() => {
    const s = this.secondsAgo();
    if (s < 60)   return `منذ ${s} ث`;
    if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
    return 'منذ وقت طويل';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.animTimer) clearInterval(this.animTimer);
    });
  }

  ngOnInit(): void {
    this.fetchStats();

    timer(30_000, 30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchStats());

    timer(1_000, 1_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.secondsAgo.update(s => s + 1));
  }

  private fetchStats(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/home/stats`)
      .pipe(map(res => res.data), catchError(() => of(null)))
      .subscribe(data => {
        if (!data) return;
        const target: Stats = {
          donors:   data.donors   ?? 0,
          families: data.families ?? 0,
          projects: data.projects ?? 0,
          amount:   data.totalAmount ?? data.total_amount ?? 0,
        };
        this.secondsAgo.set(0);
        if (this.isLoaded()) {
          this.flashing.set(true);
          setTimeout(() => this.flashing.set(false), 600);
        }
        this.animateTo(target);
        this.isLoaded.set(true);
      });
  }

  private animateTo(target: Stats): void {
    if (this.animTimer) clearInterval(this.animTimer);
    const from  = this.display();
    const steps = 90;
    let   step  = 0;

    this.animTimer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      this.display.set({
        donors:   Math.round(from.donors   + (target.donors   - from.donors)   * ease),
        families: Math.round(from.families + (target.families - from.families) * ease),
        projects: Math.round(from.projects + (target.projects - from.projects) * ease),
        amount:   Math.round(from.amount   + (target.amount   - from.amount)   * ease),
      });
      if (step >= steps) {
        clearInterval(this.animTimer!);
        this.animTimer = null;
        this.display.set(target);
      }
    }, 1000 / 60);
  }

  formatAmount(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n;
  }
}
