export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.pawprintapp.link',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',

  /** 레거시 단일 가격 (기존 PREMIUM 티어). 신규 결제는 Friend/Family로 분리. */
  premiumPriceMonthly: 3900,
  premiumPriceYearly: 39000,

  // 신규 2-tier 가격 구조 (B1)
  friendPriceMonthly: 2900,
  familyPriceMonthly: 4900,
  familyPriceYearly: 39900,

  /**
   * 신규 구독 첫 달 특가 (introductory price).
   * App Store Connect 의 "신규 구독 특가" 에 설정한 가격과 동기화.
   * StoreKit 이 결제 시 자동 적용하지만, 구독 화면 UI 에 미리 안내하기 위한 표시값.
   * null 이면 특가 미진행 (배지/문구 숨김).
   */
  familyMonthlyIntroPrice: 2900 as number | null,

  /**
   * Family 연간 결제 UI 노출 여부. 베타·초기 단계엔 false.
   * Why: 신뢰 자산 미축적 + 펫 loss 환불 리스크 + 1인 운영 deferred revenue 부담.
   * retention 3-6개월치 쌓인 뒤 true 로 전환.
   * `as boolean` 으로 위젯 코드의 dead-code 경고 회피.
   */
  showFamilyYearly: false as boolean,

  /** 레거시 product ID — 기존 구독자 verification 호환용. */
  appStoreProductId: 'com.arrivallab.pawprint.premium.monthly',
  playStoreProductId: 'pawprint_premium_monthly',

  // 신규 product IDs — App Store Connect / Play Console 에 등록 필요.
  appStoreFriendMonthly: 'com.arrivallab.pawprint.friend.monthly',
  appStoreFamilyMonthly: 'com.arrivallab.pawprint.family.monthly',
  appStoreFamilyYearly: 'com.arrivallab.pawprint.family.yearly',
  playStoreFriendMonthly: 'pawprint_friend_monthly',
  playStoreFamilyMonthly: 'pawprint_family_monthly',
  playStoreFamilyYearly: 'pawprint_family_yearly',

  freeMaxPets: 3,
  freeMaxPhotosPerRecord: 5,
  freeMaxOcrPerMonth: 5,
  freeMaxVaccineAlerts: 3,
  freeMaxShareMembers: 1,
  freeMetricsMonths: 1,
} as const;
