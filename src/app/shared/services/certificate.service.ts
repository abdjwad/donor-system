import { Injectable } from '@angular/core';

export interface CertificateData {
  donorName: string;
  amount: string;
  projectName: string;
  date: string;
  reference: string;
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  async download(data: CertificateData): Promise<void> {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const wrap = document.createElement('div');
    // Positioned at top-left but invisible — ensures full browser font rendering
    wrap.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:9999;';
    wrap.innerHTML = this.template(data);
    document.body.appendChild(wrap);

    // Wait for fonts AND a rendering tick
    await document.fonts.ready;
    await new Promise<void>(r => setTimeout(r, 300));

    try {
      const el = wrap.firstElementChild as HTMLElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`شهادة-بنيان-${data.reference}.pdf`);
    } finally {
      document.body.removeChild(wrap);
    }
  }

  private template(d: CertificateData): string {
    return `
      <div style="
        width:794px;height:562px;background:#fff;direction:rtl;
        font-family:'Cairo','Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;
        position:relative;overflow:hidden;box-sizing:border-box;">

        <!-- ══ Header band ══ -->
        <div style="
          background:linear-gradient(135deg,#0D4A25 0%,#1B6B3A 60%,#0D4A25 100%);
          padding:16px 36px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:12px;height:12px;background:#C5952A;border-radius:50%;
                        box-shadow:0 0 10px rgba(197,149,42,0.7);"></div>
            <div>
              <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.1;">بنيان</div>
              <div style="font-size:8px;letter-spacing:4px;color:rgba(197,149,42,0.9);
                          font-family:monospace;margin-top:1px;">BUNIAN</div>
            </div>
          </div>
          <div style="text-align:left;direction:ltr;">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);">منصة إعادة الإعمار</div>
            <div style="font-size:10px;color:rgba(197,149,42,0.75);letter-spacing:0.5px;">
              Reconstruction Platform</div>
          </div>
        </div>

        <!-- Gold line -->
        <div style="height:4px;background:linear-gradient(to right,#A07820,#C5952A,#E5B84A,#C5952A,#A07820);"></div>

        <!-- Corner decorations -->
        <div style="position:absolute;top:82px;right:14px;width:24px;height:24px;
                    border-top:2px solid rgba(197,149,42,0.45);border-right:2px solid rgba(197,149,42,0.45);"></div>
        <div style="position:absolute;top:82px;left:14px;width:24px;height:24px;
                    border-top:2px solid rgba(197,149,42,0.45);border-left:2px solid rgba(197,149,42,0.45);"></div>
        <div style="position:absolute;bottom:52px;right:14px;width:24px;height:24px;
                    border-bottom:2px solid rgba(197,149,42,0.45);border-right:2px solid rgba(197,149,42,0.45);"></div>
        <div style="position:absolute;bottom:52px;left:14px;width:24px;height:24px;
                    border-bottom:2px solid rgba(197,149,42,0.45);border-left:2px solid rgba(197,149,42,0.45);"></div>

        <!-- Watermark rings -->
        <div style="position:absolute;right:-60px;top:50%;margin-top:-100px;
                    width:200px;height:200px;border-radius:50%;
                    border:28px solid rgba(27,107,58,0.04);"></div>
        <div style="position:absolute;left:-60px;top:50%;margin-top:-100px;
                    width:200px;height:200px;border-radius:50%;
                    border:28px solid rgba(27,107,58,0.04);"></div>

        <!-- ══ Main content ══ -->
        <div style="padding:20px 64px 0;text-align:center;">

          <!-- Title -->
          <div style="margin-bottom:14px;">
            <div style="font-size:30px;font-weight:900;color:#1A2D5A;line-height:1.25;
                        letter-spacing:0.02em;margin-bottom:8px;">
              شهادة مساهمة
            </div>
            <div style="width:140px;height:2px;margin:0 auto;
                        background:linear-gradient(to right,transparent,#C5952A,transparent);"></div>
          </div>

          <!-- Intro -->
          <p style="font-size:13px;color:#5D6D7E;margin:0 0 10px;line-height:1.85;">
            تُقدِّم
            <span style="color:#1B6B3A;font-weight:700;">منصة بنيان لإعادة الإعمار</span>
            هذه الشهادة إلى
          </p>

          <!-- Donor name box -->
          <div style="
            display:inline-block;min-width:270px;margin:0 auto 12px;
            padding:10px 28px 12px;
            border:1.5px solid rgba(197,149,42,0.35);border-radius:8px;
            background:rgba(197,149,42,0.04);">
            <div style="font-size:27px;font-weight:800;color:#1B6B3A;line-height:1.2;">
              ${d.donorName}
            </div>
          </div>

          <!-- Amount -->
          <p style="font-size:13.5px;color:#34495E;margin:0 0 4px;line-height:2;">
            تقديرًا لمساهمته الكريمة بمبلغ
            <span style="font-size:23px;font-weight:800;color:#C5952A;"> $${d.amount}</span>
          </p>

          <!-- Project -->
          <p style="font-size:13.5px;color:#34495E;margin:0;">
            في دعم:
            <span style="color:#1B6B3A;font-weight:700;"> ${d.projectName}</span>
          </p>

          <!-- Info row -->
          <div style="
            display:flex;justify-content:center;gap:0;
            margin-top:15px;padding-top:13px;
            border-top:1px dashed rgba(0,0,0,0.08);">

            <div style="flex:1;text-align:center;padding:0 18px;border-left:1px solid #E8DDD0;">
              <div style="font-size:9.5px;color:#95A5A6;margin-bottom:4px;letter-spacing:0.5px;">التاريخ</div>
              <div style="font-size:13px;font-weight:700;color:#2C3E50;">${d.date}</div>
            </div>

            <div style="flex:1;text-align:center;padding:0 18px;border-left:1px solid #E8DDD0;">
              <div style="font-size:9.5px;color:#95A5A6;margin-bottom:4px;letter-spacing:0.5px;">رقم المرجع</div>
              <div style="font-size:11.5px;font-weight:700;color:#2C3E50;direction:ltr;">${d.reference}</div>
            </div>

            <div style="flex:1;text-align:center;padding:0 18px;">
              <div style="font-size:9.5px;color:#95A5A6;margin-bottom:4px;letter-spacing:0.5px;">الموقع</div>
              <div style="font-size:13px;font-weight:700;color:#1B6B3A;">bunian.sy</div>
            </div>

          </div>
        </div>

        <!-- Quote -->
        <div style="position:absolute;bottom:48px;left:0;right:0;text-align:center;">
          <div style="width:74%;margin:0 auto;border-top:1px solid rgba(0,0,0,0.07);padding-top:9px;">
            <div style="font-size:11.5px;color:#AAB7B8;font-style:italic;">
              "معاً نُعيد بناء سوريا ونزرع الأمل في كل بيت"
            </div>
          </div>
        </div>

        <!-- Bottom bars -->
        <div style="position:absolute;bottom:0;left:0;right:0;">
          <div style="height:4px;background:linear-gradient(to right,#A07820,#C5952A,#E5B84A,#C5952A,#A07820);"></div>
          <div style="height:10px;background:linear-gradient(135deg,#0D4A25 0%,#1B6B3A 60%,#0D4A25 100%);"></div>
        </div>

      </div>`;
  }
}
