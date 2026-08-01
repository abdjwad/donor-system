import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
import { AuthService }     from '../../../../core/services/auth.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SiteFooterComponent } from '../../../home/components/site-footer/site-footer.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    TranslateModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatTabsModule, ReactiveFormsModule, NavbarComponent, SiteFooterComponent,
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl:    './profile-settings.component.scss',
})
export class ProfileSettingsComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly authService = inject(AuthService);
  private readonly fb          = inject(FormBuilder);

  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  savedProfile  = signal(false);
  savedPassword = signal(false);
  profileError  = signal('');
  passwordError = signal('');

  profileForm = this.fb.group({
    name:  ['', [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }],
    phone: [''],
  });

  passwordForm = this.fb.group({
    current: ['', Validators.required],
    newPass: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  mockCards: { last4: string; brand: string; expiry: string; isDefault: boolean }[] = [];

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({ name: user.name, email: user.email, phone: user.phone ?? '' });
    }
  }

  saveProfile(): void {
    if (!this.profileForm.valid) return;
    const { name, phone } = this.profileForm.getRawValue();
    this.profileError.set('');
    this.authService.updateProfile({ name: name!, phone: phone ?? undefined }).subscribe({
      next: () => { this.savedProfile.set(true); setTimeout(() => this.savedProfile.set(false), 3000); },
      error: (err) => this.profileError.set(err?.error?.message ?? 'حدث خطأ'),
    });
  }

  savePassword(): void {
    if (!this.passwordForm.valid) return;
    const { current, newPass, confirm } = this.passwordForm.getRawValue();
    if (newPass !== confirm) { this.passwordError.set('كلمتا المرور غير متطابقتين'); return; }
    this.passwordError.set('');
    this.authService.changePassword({ current_password: current!, password: newPass!, password_confirmation: confirm! }).subscribe({
      next: () => { this.savedPassword.set(true); this.passwordForm.reset(); setTimeout(() => this.savedPassword.set(false), 3000); },
      error: (err) => this.passwordError.set(err?.error?.message ?? 'كلمة المرور الحالية غير صحيحة'),
    });
  }

  setLang(lang: 'ar' | 'en'): void { this.langService.setLanguage(lang); }
  setDefault(idx: number): void { this.mockCards = this.mockCards.map((c, i) => ({ ...c, isDefault: i === idx })); }
  removeCard(idx: number): void  { this.mockCards = this.mockCards.filter((_, i) => i !== idx); }
}
