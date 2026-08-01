import { Testimonial } from '../../../core/models/project.model';

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    nameAr: 'أحمد محمود',    nameEn: 'Ahmad Mahmoud',
    roleAr: 'متبرع من السعودية', roleEn: 'Donor from Saudi Arabia',
    textAr: 'منصة بنيان جعلت التبرع شفافاً وسهلاً. أستطيع متابعة أثر تبرعي خطوة بخطوة. فخور بكل مبلغ قدمته.',
    textEn: 'Bunian made donating transparent and easy. I can follow my donation impact step by step. Proud of every dollar contributed.',
    initials: 'أ.م', avatarColor: '#1B6B3A', rating: 5,
  },
  {
    id: 2,
    nameAr: 'فاطمة الزهراء', nameEn: 'Fatima Al-Zahra',
    roleAr: 'متبرعة من الإمارات', roleEn: 'Donor from UAE',
    textAr: 'لم أصدق كم المنصة موثوقة حتى رأيت صور "قبل وبعد" من المشروع الذي تبرعت له. شكراً لهذا الجهد الرائع.',
    textEn: "I couldn't believe how trustworthy the platform is until I saw before/after photos from my donated project. Thank you.",
    initials: 'ف.ز', avatarColor: '#C5952A', rating: 5,
  },
  {
    id: 3,
    nameAr: 'خالد عبدالله',  nameEn: 'Khalid Abdullah',
    roleAr: 'متبرع من الكويت', roleEn: 'Donor from Kuwait',
    textAr: 'أنصح كل من يريد مساعدة الشعب السوري بالتبرع عبر بنيان. التقارير الشهرية تعطيني ثقة كاملة.',
    textEn: 'I recommend everyone who wants to help the Syrian people to donate through Bunian. Monthly reports give me full confidence.',
    initials: 'خ.ع', avatarColor: '#1A2D5A', rating: 5,
  },
  {
    id: 4,
    nameAr: 'مريم يوسف',     nameEn: 'Mariam Yousuf',
    roleAr: 'متبرعة من قطر',  roleEn: 'Donor from Qatar',
    textAr: 'سهولة الدفع والتبرع الفوري دون إنشاء حساب ميزة رائعة. بنيان تفهم احتياجات المتبرعين.',
    textEn: 'Easy payment and instant donation without creating an account is amazing. Bunian understands donors needs.',
    initials: 'م.ي', avatarColor: '#2E8B57', rating: 4,
  },
];
