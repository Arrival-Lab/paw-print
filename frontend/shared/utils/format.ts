import i18n from '../i18n';

// 'long' 포맷은 현재 언어에 맞춰 출력. 'yyyy년 MM월 dd일' 은 한국어 long 의 레거시 별칭.
export const formatDate = (
  date: Date | string | null | undefined,
  format: 'yyyy-MM-dd' | 'long' | 'yyyy년 MM월 dd일' = 'yyyy-MM-dd',
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (format === 'long' || format === 'yyyy년 MM월 dd일') {
    switch (i18n.language) {
      case 'en':
        return `${MM}/${dd}/${yyyy}`;
      case 'ja':
        return `${yyyy}年${MM}月${dd}日`;
      default:
        return `${yyyy}년 ${MM}월 ${dd}일`;
    }
  }
  return `${yyyy}-${MM}-${dd}`;
};

export const formatNumber = (num: number): string => num.toLocaleString('ko-KR');

// 가격은 KRW. ₩ 기호는 언어 중립이라 ko/en/ja 공통 사용 (천단위 구분 포함).
export const formatPrice = (amount: number): string => `₩${formatNumber(amount)}`;
