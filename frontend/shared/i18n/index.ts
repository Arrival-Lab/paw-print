import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useLocaleStore, resolveInitialLocale } from '../store/localeStore';
import ko from './locales/ko/common.json';
import en from './locales/en/common.json';
import ja from './locales/ja/common.json';

// 리소스는 인라인 번들 → init 이 동기적으로 완료되어 첫 렌더에서 바로 사용 가능.
// 미번역 키는 fallbackLng(ko) 로 폴백되므로 en/ja 가 비어 있어도 한국어가 노출된다.
i18n.use(initReactI18next).init({
  resources: {
    ko: { common: ko },
    en: { common: en },
    ja: { common: ja },
  },
  lng: resolveInitialLocale(),
  fallbackLng: 'ko',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false }, // RN 은 XSS 위험 없음
  returnNull: false,
});

// localeStore(사용자 언어 선택) → i18n 동기화. 스위처에서 setLocale 하면 즉시 반영.
useLocaleStore.subscribe((state) => {
  if (i18n.language !== state.locale) {
    void i18n.changeLanguage(state.locale);
  }
});

export default i18n;
