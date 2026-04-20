export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  premiumPriceMonthly: 3900,
  premiumPriceYearly: 39000,
  appStoreProductId: 'com.arrivallab.pawprint.premium.monthly',
  playStoreProductId: 'pawprint_premium_monthly',
  freeMaxPets: 3,
  freeMaxPhotosPerRecord: 2,
  freeMaxOcrPerMonth: 3,
  freeMaxVaccineAlerts: 2,
  freeMaxShareMembers: 1,
  freeMetricsMonths: 1,
} as const;
