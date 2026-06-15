import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import * as Localization from 'expo-localization';

export type AppLocale = 'ko' | 'en' | 'ja';
export const SUPPORTED_LOCALES: AppLocale[] = ['ko', 'en', 'ja'];

const storage = createMMKV({ id: 'pawprint-locale' });
const STORAGE_KEY = 'locale';

function isSupported(v: string | null | undefined): v is AppLocale {
  return v === 'ko' || v === 'en' || v === 'ja';
}

/** 기기 언어 → 지원 locale. 미지원 언어는 주 시장인 ko 로 폴백. */
function deviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? 'ko';
  return isSupported(code) ? code : 'ko';
}

/** 저장된 사용자 선택이 있으면 그것을, 없으면 기기 언어를 초기 locale 로 사용. */
export function resolveInitialLocale(): AppLocale {
  const saved = storage.getString(STORAGE_KEY);
  return isSupported(saved) ? saved : deviceLocale();
}

interface LocaleState {
  locale: AppLocale;
  /** 사용자가 직접 고른 값인지 (false 면 기기 언어를 따라간 것). */
  isExplicit: boolean;
  setLocale: (locale: AppLocale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: resolveInitialLocale(),
  isExplicit: isSupported(storage.getString(STORAGE_KEY)),
  setLocale: (locale) => {
    storage.set(STORAGE_KEY, locale);
    set({ locale, isExplicit: true });
  },
}));

/** 인터셉터 등 React 외부(동기 접근)에서 현재 locale 을 읽기 위한 헬퍼. */
export const getCurrentLocale = (): AppLocale => useLocaleStore.getState().locale;
