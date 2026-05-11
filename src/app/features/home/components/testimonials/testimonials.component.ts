import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/services/language.service';
import { MOCK_TESTIMONIALS } from '../../data/mock-data';
import { Testimonial } from '../../../../core/models/project.model';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
  readonly testimonials: Testimonial[] = MOCK_TESTIMONIALS;

  getName(t: Testimonial): string  { return this.isRtl() ? t.nameAr  : t.nameEn;  }
  getRole(t: Testimonial): string  { return this.isRtl() ? t.roleAr  : t.roleEn;  }
  getText(t: Testimonial): string  { return this.isRtl() ? t.textAr  : t.textEn;  }
  getStars(n: number): number[]    { return Array.from({ length: n }); }
}
