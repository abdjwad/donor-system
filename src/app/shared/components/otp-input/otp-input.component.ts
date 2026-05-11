import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  Input,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
})
export class OtpInputComponent implements ControlValueAccessor, OnInit {
  @Input() length = 6;
  @Input() disabled = false;

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly platformId = inject(PLATFORM_ID);

  digits: string[] = [];
  indices: number[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.indices = Array.from({ length: this.length }, (_, i) => i);
    this.digits = new Array(this.length).fill('');
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.digits[index] = val ? val[0] : '';
    input.value = this.digits[index];
    this.emitValue();

    if (this.digits[index] && index < this.length - 1) {
      this.focusBox(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        this.focusBox(index - 1);
        this.emitValue();
      }
    }
    if (event.key === 'ArrowLeft') {
      this.focusBox(index - 1);
    }
    if (event.key === 'ArrowRight') {
      this.focusBox(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') ?? '';
    const nums = paste.replace(/\D/g, '').slice(0, this.length).split('');
    nums.forEach((d, i) => {
      this.digits[i] = d;
    });
    this.emitValue();
    const lastFilled = Math.min(nums.length, this.length - 1);
    this.focusBox(lastFilled);
  }

  onFocus(index: number): void {
    const boxes = this.otpBoxes?.toArray();
    if (boxes?.[index]) {
      boxes[index].nativeElement.select();
    }
  }

  writeValue(value: string): void {
    const chars = (value ?? '').split('').slice(0, this.length);
    this.digits = new Array(this.length).fill('').map((_, i) => chars[i] ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private emitValue(): void {
    this.onChange(this.digits.join(''));
    this.onTouched();
  }

  private focusBox(index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (index < 0 || index >= this.length) return;
    const boxes = this.otpBoxes?.toArray();
    boxes?.[index]?.nativeElement.focus();
  }
}
