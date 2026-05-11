import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap" [class.spinner-wrap--overlay]="overlay">
      <div class="spinner">
        <div class="spinner__ring"></div>
        <div class="spinner__ring spinner__ring--2"></div>
      </div>
    </div>
  `,
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
}
