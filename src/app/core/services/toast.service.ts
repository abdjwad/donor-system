import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  error(message: string, durationMs = 6000): void {
    this.push('error', message, durationMs);
  }

  success(message: string, durationMs = 4000): void {
    this.push('success', message, durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string, durationMs: number): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
