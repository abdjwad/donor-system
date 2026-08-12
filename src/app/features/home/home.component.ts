import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { StatsSectionComponent } from './components/stats-section/stats-section.component';
import { FeaturedCampaignsComponent } from './components/featured-campaigns/featured-campaigns.component';
import { FeaturedProjectsComponent } from './components/featured-projects/featured-projects.component';
import { TrustedContractorsComponent } from './components/trusted-contractors/trusted-contractors.component';
import { DonationCtaComponent } from './components/donation-cta/donation-cta.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TranslateModule,
    NavbarComponent,
    HeroSectionComponent,
    StatsSectionComponent,
    FeaturedCampaignsComponent,
    FeaturedProjectsComponent,
    TrustedContractorsComponent,
    DonationCtaComponent,
    TestimonialsComponent,
    SiteFooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly langService = inject(LanguageService);
  readonly isRtl = computed(() => this.langService.currentLang() === 'ar');
}
