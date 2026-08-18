export const environment = {
  production: true,
  apiUrl: 'http://161.97.126.253:8080/api',
  // لازم Ganache يشتغل عالسيرفر نفسه على هالبورت، ومفتوح بالـ firewall —
  // هاد الرابط يلي محفظة أي زائر (مو بس السيرفر نفسه) بدها تتوصل فيه
  ganacheRpcUrl: 'http://161.97.126.253:8545',
  // مفتاح Stripe العلني لوضع الإنتاج/الاختبار — حط مفتاحك هون قبل النشر
  stripePublishableKey: 'pk_test_51U5tifQ9XwNk3Ag1UUEtyr1ZAD8J84UEg1tJuW65CKGyaDmxZbz2bfiyiKCFQURonQo6gO6AHQODh7gUc7NRToCG00dSqHXfHK',
};
