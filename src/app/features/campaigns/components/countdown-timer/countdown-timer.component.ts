import { Component, computed, inject, Input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.scss',
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() daysLeft = 0;

  private readonly platformId = inject(PLATFORM_ID);
  private interval?: ReturnType<typeof setInterval>;

  readonly totalSeconds = signal(0);
  readonly days    = computed(() => Math.floor(this.totalSeconds() / 86400));
  readonly hours   = computed(() => Math.floor((this.totalSeconds() % 86400) / 3600));
  readonly minutes = computed(() => Math.floor((this.totalSeconds() % 3600) / 60));
  readonly seconds = computed(() => this.totalSeconds() % 60);
  readonly ended   = computed(() => this.totalSeconds() <= 0);

  ngOnInit(): void {
    this.totalSeconds.set(this.daysLeft * 86400);
    if (!isPlatformBrowser(this.platformId)) return;
    this.interval = setInterval(() => {
      this.totalSeconds.update((v) => Math.max(0, v - 1));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  pad(n: number): string { return n.toString().padStart(2, '0'); }
}
