import { Campaign, PlatformStats, Project, Testimonial } from '../../../core/models/project.model';

export const MOCK_PROJECTS: Project[] = [
  { id: 1,  titleAr: 'إعادة بناء منازل في حلب القديمة',   title: 'Rebuilding Homes in Old Aleppo',       location: 'Aleppo',    locationAr: 'حلب',          imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&q=80', fundingGoal: 80000,  amountRaised: 54000,  donors: 342,  status: 'active',    category: 'housing',        urgency: 'high',   daysActive: 45,  featured: true },
  { id: 2,  titleAr: 'مدرسة الأمل في حمص',                title: 'Hope School — Homs',                  location: 'Homs',      locationAr: 'حمص',          imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80', fundingGoal: 40000,  amountRaised: 38500,  donors: 218,  status: 'active',    category: 'education',      urgency: 'high',   daysActive: 62,  featured: true },
  { id: 3,  titleAr: 'مركز صحي في إدلب',                  title: 'Medical Center — Idlib',              location: 'Idlib',     locationAr: 'إدلب',         imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80', fundingGoal: 120000, amountRaised: 67000,  donors: 511,  status: 'active',    category: 'health',         urgency: 'high',   daysActive: 30,  featured: true },
  { id: 4,  titleAr: 'شبكة مياه في درعا',                 title: 'Water Network — Daraa',               location: 'Daraa',     locationAr: 'درعا',         imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', fundingGoal: 35000,  amountRaised: 12000,  donors: 98,   status: 'active',    category: 'water',          urgency: 'medium', daysActive: 15,  featured: true },
  { id: 5,  titleAr: 'طريق وصل القرى في اللاذقية',        title: 'Connecting Road — Latakia',           location: 'Latakia',   locationAr: 'اللاذقية',     imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', fundingGoal: 60000,  amountRaised: 41000,  donors: 187,  status: 'active',    category: 'infrastructure', urgency: 'medium', daysActive: 55,  featured: true },
  { id: 6,  titleAr: 'بناء مسكن للمهجّرين في دمشق',      title: 'Displaced Families Housing — Damascus', location: 'Damascus',  locationAr: 'دمشق',         imageUrl: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80', fundingGoal: 200000, amountRaised: 145000, donors: 892,  status: 'active',    category: 'housing',        urgency: 'high',   daysActive: 90,  featured: true },
  { id: 7,  titleAr: 'مستشفى ميداني في الرقة',            title: 'Field Hospital — Raqqa',              location: 'Raqqa',     locationAr: 'الرقة',        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80', fundingGoal: 95000,  amountRaised: 95000,  donors: 630,  status: 'completed', category: 'health',         urgency: 'low',    daysActive: 120, featured: false },
  { id: 8,  titleAr: 'إعادة بناء مخيم عائلات في دير الزور', title: 'Families Camp — Deir ez-Zor',        location: 'Deir ez-Zor', locationAr: 'دير الزور',  imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80', fundingGoal: 55000,  amountRaised: 28000,  donors: 143,  status: 'active',    category: 'housing',        urgency: 'high',   daysActive: 22,  featured: false },
  { id: 9,  titleAr: 'كلية تقنية في حلب الجديدة',         title: 'Technical College — New Aleppo',      location: 'Aleppo',    locationAr: 'حلب',          imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80', fundingGoal: 75000,  amountRaised: 30000,  donors: 210,  status: 'active',    category: 'education',      urgency: 'medium', daysActive: 38,  featured: false },
  { id: 10, titleAr: 'محطة معالجة المياه في السويداء',    title: 'Water Treatment Plant — Sweida',      location: 'Sweida',    locationAr: 'السويداء',     imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80', fundingGoal: 110000, amountRaised: 72000,  donors: 388,  status: 'active',    category: 'water',          urgency: 'medium', daysActive: 75,  featured: false },
  { id: 11, titleAr: 'جسر عمر في إدلب الشمالية',          title: 'Omar Bridge — North Idlib',           location: 'Idlib',     locationAr: 'إدلب',         imageUrl: 'https://images.unsplash.com/photo-1571782742678-6d4d7a8d2a44?w=600&q=80', fundingGoal: 150000, amountRaised: 48000,  donors: 267,  status: 'active',    category: 'infrastructure', urgency: 'medium', daysActive: 28,  featured: false },
  { id: 12, titleAr: 'عيادة الأطفال في حمص الجديدة',      title: 'Children\'s Clinic — New Homs',       location: 'Homs',      locationAr: 'حمص',          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80', fundingGoal: 45000,  amountRaised: 45000,  donors: 324,  status: 'completed', category: 'health',         urgency: 'low',    daysActive: 100, featured: false },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    titleAr: 'حملة رمضان — نبني معاً',
    title: 'Ramadan Campaign — Build Together',
    descriptionAr: 'في هذا الشهر الكريم، تضاعف أثر تبرعك لإعادة بناء المنازل المدمرة',
    description: 'This holy month, double your impact and help rebuild destroyed homes',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=700&q=80',
    targetAmount: 500000, raisedAmount: 347000, daysLeft: 18, donorCount: 2145, featured: true,
  },
  {
    id: 2,
    titleAr: 'مشروع الأمل — مدارس سوريا',
    title: 'Hope Project — Syria Schools',
    descriptionAr: 'ساعد في بناء 10 مدارس جديدة للأطفال الذين حُرموا من التعليم',
    description: 'Help build 10 new schools for children deprived of education',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=700&q=80',
    targetAmount: 300000, raisedAmount: 198000, daysLeft: 32, donorCount: 1432, featured: true,
  },
  {
    id: 3,
    titleAr: 'طوارئ الشمال السوري',
    title: 'Northern Syria Emergency',
    descriptionAr: 'استجابة عاجلة لأكثر من 50,000 نازح في شمال سوريا',
    description: 'Emergency response for over 50,000 displaced people in northern Syria',
    imageUrl: 'https://images.unsplash.com/photo-1593113630400-ea4288922559?w=700&q=80',
    targetAmount: 1000000, raisedAmount: 612000, daysLeft: 7, donorCount: 4820, featured: true,
  },
];

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

export const PLATFORM_STATS: PlatformStats = {
  donors: 12450,
  families: 3200,
  projects: 840,
  totalAmount: 2400000,
};
