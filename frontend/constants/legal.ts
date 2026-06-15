import type { AppLocale } from '../shared/store/localeStore';

/**
 * locale 별 약관/개인정보처리방침 URL.
 * marketing-site 구조와 일치: ko 는 루트(`/support/privacy`), en/ja 는 하위 경로(`/support/privacy/en`).
 * 하드코딩 URL 을 화면에 흩뿌리지 않도록 이 헬퍼로만 생성한다.
 */
const LEGAL_BASE = 'https://pawprintapp.link/support';

export type LegalDoc = 'privacy' | 'terms';

export function legalUrl(doc: LegalDoc, locale: AppLocale): string {
  const suffix = locale === 'ko' ? '' : `/${locale}`;
  return `${LEGAL_BASE}/${doc}${suffix}`;
}
