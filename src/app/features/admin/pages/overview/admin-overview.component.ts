import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService }  from '../../../../core/services/language.service';
import { AdminApiService, AdminCategory, AdminOverview, AdminRecentDonation } from '../../../../core/services/admin-api.service';

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#1B6B3A', education: '#C5952A', health: '#1A2D5A',
  infrastructure: '#2E8B57', water: '#7A5810',
};
const CATEGORY_AR: Record<string, string> = {
  housing: 'إسكان', education: 'تعليم', health: 'صحة',
  infrastructure: 'بنية تحتية', water: 'مياه',
};

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './admin-overview.component.html',
  styleUrl:    './admin-overview.component.scss',
})
export class AdminOverviewComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  private readonly adminApi    = inject(AdminApiService);

  readonly isRtl   = computed(() => this.langService.currentLang() === 'ar');
  readonly loading = signal(true);
  readonly generatingPdf = signal(false);

  stats      = signal<{ key: string; icon: string; value: string; change: string }[]>([]);
  recent     = signal<AdminRecentDonation[]>([]);
  categories = signal<(AdminCategory & { pct: number; color: string; labelAr: string })[]>([]);

  private statLabels: Record<string, string> = {
    TOTAL_DONATIONS: 'إجمالي التبرعات', TOTAL_DONORS: 'إجمالي المتبرعين',
    FAMILIES_HELPED: 'أسرة استفادت', ACTIVE_PROJECTS: 'مشاريع نشطة', PENDING_REFUNDS: 'استردادات معلقة',
  };

  ngOnInit(): void {
    this.adminApi.getOverview().subscribe({
      next: (data: AdminOverview) => {
        const s = data.stats;
        this.stats.set([
          { key: 'TOTAL_DONATIONS', icon: 'paid',            value: '$' + this.fmt(s.total_donations), change: '' },
          { key: 'TOTAL_DONORS',    icon: 'group',           value: String(s.total_donors),            change: '' },
          { key: 'FAMILIES_HELPED', icon: 'home_work',       value: String(s.families_helped),         change: '' },
          { key: 'ACTIVE_PROJECTS', icon: 'construction',    value: String(s.active_projects),         change: '' },
          { key: 'PENDING_REFUNDS', icon: 'pending_actions', value: String(s.pending_refunds),         change: '' },
        ]);
        this.recent.set(data.recent_donations);
        const totalFunding = data.by_category.reduce((sum, c) => sum + c.total, 0) || 1;
        this.categories.set(data.by_category.map(c => ({
          ...c,
          pct:     Math.round((c.total / totalFunding) * 100),
          color:   CATEGORY_COLORS[c.category] ?? '#888',
          labelAr: CATEGORY_AR[c.category] ?? c.category,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  donorName(r: AdminRecentDonation): string   { return r.name; }
  projectName(r: AdminRecentDonation): string { return this.isRtl() ? r.project_ar : r.project_en; }
  catLabel(c: { labelAr: string; category: string }): string { return this.isRtl() ? c.labelAr : c.category; }

  private fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  // تحميل تقرير PDF شامل لكل بيانات النظرة العامة (الإحصائيات، آخر التبرعات،
  // توزيع الفئات) — بنفس أسلوب شهادة المساهمة (html2canvas + jsPDF)، مع تقسيم
  // تلقائي لعدة صفحات A4 لو المحتوى أطول من صفحة وحدة
  async downloadPdf(): Promise<void> {
    if (this.generatingPdf()) return;
    this.generatingPdf.set(true);

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:9999;';
    wrap.innerHTML = this.reportTemplate();
    document.body.appendChild(wrap);

    await document.fonts.ready;
    await new Promise<void>((r) => setTimeout(r, 300));

    try {
      const el = wrap.firstElementChild as HTMLElement;
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth   = pageWidth;
      const imgHeight  = (canvas.height * imgWidth) / canvas.width;
      const img = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`تقرير-النظرة-العامة-بنيان-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      document.body.removeChild(wrap);
      this.generatingPdf.set(false);
    }
  }

  private reportTemplate(): string {
    const statsHtml = this.stats().map((s) => `
      <div style="flex:1;min-width:130px;background:#F8F4EE;border:1px solid #E8DDD0;border-radius:10px;padding:14px 10px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#1B6B3A;font-family:'Segoe UI',Tahoma,sans-serif;">${s.value}</div>
        <div style="font-size:11px;color:#7F8C8D;margin-top:4px;">${this.statLabels[s.key] ?? s.key}</div>
      </div>`).join('');

    const recentRows = this.recent().map((r) => `
      <tr>
        <td style="padding:9px 12px;border-bottom:1px solid #EFEAE2;font-size:12px;">${r.name}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #EFEAE2;font-size:12px;">${r.project_ar}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #EFEAE2;font-size:12px;font-weight:700;color:#C5952A;">$${r.amount}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #EFEAE2;font-size:12px;">${r.status}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #EFEAE2;font-size:11px;color:#95A5A6;">${r.created_at}</td>
      </tr>`).join('');

    const categoryRows = this.categories().map((c) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
          <span style="color:#34495E;font-weight:600;">${c.labelAr}</span>
          <span style="color:#7F8C8D;">${c.pct}% — $${c.total.toLocaleString()}</span>
        </div>
        <div style="height:8px;background:#F0EBE2;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${c.pct}%;background:${c.color};"></div>
        </div>
      </div>`).join('');

    return `
      <div style="width:780px;background:#fff;direction:rtl;
        font-family:'Cairo','Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;
        box-sizing:border-box;padding:0 0 24px;">

        <div style="background:linear-gradient(135deg,#0D4A25 0%,#1B6B3A 60%,#0D4A25 100%);padding:22px 32px;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:11px;height:11px;background:#C5952A;border-radius:50%;"></div>
            <span style="font-size:22px;font-weight:800;color:#fff;">بنيان</span>
          </div>
          <div style="text-align:left;direction:ltr;color:rgba(255,255,255,0.65);font-size:11px;">
            ${new Date().toLocaleDateString('ar-SY')}
          </div>
        </div>
        <div style="height:4px;background:linear-gradient(to right,#A07820,#C5952A,#E5B84A,#C5952A,#A07820);"></div>

        <div style="padding:24px 32px;">
          <h1 style="font-size:20px;font-weight:800;color:#1A2D5A;margin:0 0 4px;">تقرير النظرة العامة</h1>
          <p style="font-size:12px;color:#95A5A6;margin:0 0 20px;">لقطة شاملة لأداء المنصة لحظة توليد هذا التقرير</p>

          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px;">${statsHtml}</div>

          <h2 style="font-size:14px;font-weight:700;color:#1A2D5A;margin:0 0 10px;border-right:3px solid #C5952A;padding-right:8px;">آخر التبرعات</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">
            <thead>
              <tr style="background:#F8F4EE;">
                <th style="padding:8px 12px;font-size:11px;color:#7F8C8D;text-align:start;">المتبرّع</th>
                <th style="padding:8px 12px;font-size:11px;color:#7F8C8D;text-align:start;">المشروع</th>
                <th style="padding:8px 12px;font-size:11px;color:#7F8C8D;text-align:start;">المبلغ</th>
                <th style="padding:8px 12px;font-size:11px;color:#7F8C8D;text-align:start;">الحالة</th>
                <th style="padding:8px 12px;font-size:11px;color:#7F8C8D;text-align:start;">التاريخ</th>
              </tr>
            </thead>
            <tbody>${recentRows}</tbody>
          </table>

          <h2 style="font-size:14px;font-weight:700;color:#1A2D5A;margin:0 0 12px;border-right:3px solid #C5952A;padding-right:8px;">توزيع التمويل حسب الفئة</h2>
          ${categoryRows}
        </div>

        <div style="height:4px;background:linear-gradient(to right,#A07820,#C5952A,#E5B84A,#C5952A,#A07820);margin-top:8px;"></div>
      </div>`;
  }
}
