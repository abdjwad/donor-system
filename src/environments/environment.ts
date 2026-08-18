export const environment = {
  production: false,
  apiUrl: '/api',
  ganacheRpcUrl: 'http://127.0.0.1:8545',
  // مفتاح Stripe العلني (Publishable Key) — آمن يظهر بالفرونت اند بطبيعته (مو سري
  // متل الـSecret Key اللي بالباك اند فقط). حط مفتاح وضع الاختبار (pk_test_...) هون
  stripePublishableKey: 'pk_test_51U5tifQ9XwNk3Ag1UUEtyr1ZAD8J84UEg1tJuW65CKGyaDmxZbz2bfiyiKCFQURonQo6gO6AHQODh7gUc7NRToCG00dSqHXfHK',
};
