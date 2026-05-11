import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language.service';
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
export class ProfileSettingsComponent {
  private readonly langService = inject(LanguageService);
  private readonly fb          = inject(FormBuilder);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');

  savedProfile = signal(false);
  savedPassword = signal(false);

  profileForm = this.fb.group({
    name:  ['أحمد محمد العلي', [Validators.required, Validators.minLength(3)]],
    email: ['ahmed@example.com', [Validators.required, Validators.email]],
    phone: ['+963 944 123 456'],
  });

  passwordForm = this.fb.group({
    current: ['', Validators.required],
    newPass: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  mockCards = [
    { last4: '4242', brand: 'Visa',       expiry: '12/27', isDefault: true  },
    { last4: '5353', brand: 'Mastercard', expiry: '06/26', isDefault: false },
  ];

  saveProfile(): void  { if (this.profileForm.valid)  { this.savedProfile.set(true);  setTimeout(() => this.savedProfile.set(false), 3000); } }
  savePassword(): void { if (this.passwordForm.valid) { this.savedPassword.set(true); setTimeout(() => this.savedPassword.set(false), 3000); this.passwordForm.reset(); } }
  setLang(lang: 'ar' | 'en'): void { this.langService.setLanguage(lang); }
  setDefault(idx: number): void { this.mockCards = this.mockCards.map((c, i) => ({ ...c, isDefault: i === idx })); }
  removeCard(idx: number): void  { this.mockCards = this.mockCards.filter((_, i) => i !== idx); }
}
